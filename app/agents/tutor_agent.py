import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from app.prompts.tutor_prompt import TUTOR_SYSTEM_PROMPT


load_dotenv()


def tutor_agent(query, context, chat_history=None):
    """
    AI Tutor Assistant.

    Answers questions using only the retrieved tutor documents.
    """

    # ---------------------------------------------------------
    # Gemini model
    # ---------------------------------------------------------

    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash-lite",
    )

    llm = ChatGoogleGenerativeAI(
        model=model_name,
    )

    # ---------------------------------------------------------
    # Conversation history
    # ---------------------------------------------------------

    history_text = ""

    if chat_history:

        history_text = "\n".join(
            [
                f"{message.get('role', 'user')}: "
                f"{message.get('content', '')}"
                for message in chat_history
            ]
        )

    # ---------------------------------------------------------
    # Build prompt
    # ---------------------------------------------------------

    prompt = f"""
{TUTOR_SYSTEM_PROMPT}

TEACHING MATERIAL

{context}

PREVIOUS CONVERSATION

{history_text}

USER QUESTION

{query}

Answer the user's question now.

Remember:
- Behave like a professional AI Tutor.
- Use only the provided teaching material.
- Explain concepts clearly and step by step.
- Give examples when supported by the teaching material.
- Do not invent information.
- If the answer is not available in the uploaded documents,
  clearly say that it is not available in the uploaded material.
"""

    # ---------------------------------------------------------
    # Call Gemini
    # ---------------------------------------------------------

    try:

        result = llm.invoke(prompt)

        return result.content

    except Exception as e:

        error_message = str(e)

        print()
        print("=" * 60)
        print("[TUTOR] GEMINI ERROR")
        print("=" * 60)
        print("Model:", model_name)
        print("Error type:", type(e).__name__)
        print("Error:", error_message)
        print("=" * 60)
        print()

        # -----------------------------------------------------
        # Quota / rate limit
        # -----------------------------------------------------

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
            or "quota" in error_message.lower()
        ):
            raise RuntimeError(
                "The Gemini API quota has been reached. "
                "Please try again later or use another "
                "available Gemini model."
            )

        # -----------------------------------------------------
        # Temporary Gemini service problem
        # -----------------------------------------------------

        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):
            raise RuntimeError(
                "The Gemini AI service is temporarily "
                "unavailable. Please try again later."
            )

        # -----------------------------------------------------
        # Other Gemini error
        # -----------------------------------------------------

        raise