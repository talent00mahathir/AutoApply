"""AutoApply Pipeline Execution Service with Dynamic Multi-Model Fallback.

Executes the 4-agent ADK SequentialAgent pipeline. If the primary model experiences
high-demand spikes (503), quota limits (429), or timeouts, it automatically rebuilds
and executes the pipeline using the configured backup models.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict
from dotenv import load_dotenv
from google.adk.runners import InMemoryRunner
from google.genai import types

load_dotenv()

from app.pipeline.agents import (
    MODEL_FALLBACK_CHAIN,
    create_autoapply_pipeline
)

logger = logging.getLogger("autoapply.pipeline")


def sanitize_json(raw_text: Any) -> Any:
    """Safely parse LLM output string to JSON, stripping code fences if present."""
    if not isinstance(raw_text, str):
        return raw_text

    cleaned = raw_text.strip()

    # Remove markdown code fences if present (```json ... ``` or ``` ...)
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    # Attempt standard JSON loading
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback regex search for JSON object or array
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return {"raw_text": cleaned}


async def run_pipeline(
    job_text: str,
    resume_text: str,
    user_id: str = "autoapply_user"
) -> Dict[str, Any]:
    """Execute the 4-agent pipeline sequentially with automatic model failover.

    Args:
        job_text: Raw job description text.
        resume_text: Raw resume text.
        user_id: User identifier for session isolation.

    Returns:
        Dictionary containing parsed outputs from all 4 agents and active_model name.
    """
    if not job_text.strip():
        raise ValueError("Job description text cannot be empty.")
    if not resume_text.strip():
        raise ValueError("Resume text cannot be empty.")

    last_error = None
    active_successful_model = None
    final_state = None
    session_id_used = None

    # Iterate through the fallback chain: Primary -> Secondary -> Tertiary
    for model_idx, model_name in enumerate(MODEL_FALLBACK_CHAIN):
        logger.info(f"[*] Attempting pipeline with model: {model_name} (Priority #{model_idx + 1})")
        print(f"[*] [ADK Pipeline] Attempting model: {model_name} (Priority #{model_idx + 1} of {len(MODEL_FALLBACK_CHAIN)})")

        try:
            # 1. Dynamically instantiate the 4-agent pipeline with current model
            pipeline = create_autoapply_pipeline(model_name=model_name)
            runner = InMemoryRunner(agent=pipeline, app_name="autoapply_core")

            # 2. Initialize clean session state with inputs
            session = await runner.session_service.create_session(
                app_name="autoapply_core",
                user_id=user_id,
                state={
                    "job_text": job_text.strip(),
                    "resume_text": resume_text.strip()
                }
            )

            # 3. Trigger execution
            trigger_message = types.Content(
                role="user",
                parts=[types.Part(text="Execute full AutoApply analysis and tailoring pipeline.")]
            )

            # 4. Stream and run execution
            async for _ in runner.run_async(
                user_id=user_id,
                session_id=session.id,
                new_message=trigger_message
            ):
                pass

            # 5. Retrieve enriched final session state
            final_session = await runner.session_service.get_session(
                app_name="autoapply_core",
                user_id=user_id,
                session_id=session.id
            )

            state = final_session.state or {}

            # Verify that key agent outputs were generated
            if "job_requirements" in state and "match_analysis" in state and "tailored_content" in state:
                active_successful_model = model_name
                final_state = state
                session_id_used = session.id
                print(f"[SUCCESS] ADK Pipeline executed successfully using model: {model_name}!")
                break
            else:
                raise ValueError(f"Incomplete pipeline state returned from {model_name}: {list(state.keys())}")

        except Exception as e:
            err_str = str(e)
            last_error = e
            print(f"[!] ADK Pipeline encountered error with {model_name}: {err_str[:120]}")

            # Check if there is another backup model in the chain
            if model_idx < len(MODEL_FALLBACK_CHAIN) - 1:
                next_backup = MODEL_FALLBACK_CHAIN[model_idx + 1]
                print(f"[*] Auto-failing over to next model: {next_backup}...")
                await asyncio.sleep(1)
                continue
            else:
                print("[CRITICAL] All fallback models in the chain were exhausted.")

    if not final_state:
        raise RuntimeError(f"All ADK fallback models failed. Last error: {last_error}")

    # 6. Parse and structure all 4 agent outputs
    parsed_job = sanitize_json(final_state.get("job_requirements", {}))
    parsed_resume = sanitize_json(final_state.get("candidate_profile", {}))
    parsed_match = sanitize_json(final_state.get("match_analysis", {}))
    parsed_tailored = sanitize_json(final_state.get("tailored_content", {}))

    # 7. Assemble complete tailored CV document
    contact_info = parsed_resume.get("contact_info", {})
    education = parsed_resume.get("education", [])
    references = parsed_resume.get("references", [])
    co_curricular = parsed_resume.get("co_curricular", [])

    final_tailored_cv = {
        "contact_info": contact_info,
        "professional_summary": parsed_tailored.get("professional_summary", ""),
        "categorized_skills": parsed_tailored.get("categorized_skills", {}),
        "tailored_projects": parsed_tailored.get("tailored_projects", []),
        "education": education,
        "co_curricular": co_curricular,
        "references": references
    }

    return {
        "session_id": session_id_used,
        "active_model": active_successful_model,
        "job_requirements": parsed_job,
        "candidate_profile": parsed_resume,
        "match_analysis": parsed_match,
        "tailored_content": parsed_tailored,
        "final_tailored_cv": final_tailored_cv
    }
