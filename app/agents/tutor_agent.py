from langchain_google_genai import ChatGoogleGenerativeAI

from app.prompts.tutor_prompt import TUTOR_SYSTEM_PROMPT


def tutor_agent(query, context, chat_history=None):
    """
    AI Tutor / Trainer.

    Answers questions using only the retrieved tutor documents.
    """

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        temperature=0.2,
    )

    history_text = ""

    if chat_history:

        history_text = "\n".join(
            [
                f"{message.get('role', 'user')}: "
                f"{message.get('content', '')}"
                for message in chat_history
            ]
        )

    prompt = f"""
{TUTOR_SYSTEM_PROMPT}

LEARNING MATERIAL

{context}

PREVIOUS CONVERSATION

{history_text}

STUDENT QUESTION

{query}

Answer the student's question now.

Remember:
- Answer as a professional trainer.
- Use only the provided learning material.
- Keep the explanation clear and beginner-friendly.
- Do not mention internal RAG implementation.
- If the information is not present in the learning material, clearly
  state that it is not available in the uploaded learning materials.
"""

    result = llm.invoke(prompt)

    return result.content