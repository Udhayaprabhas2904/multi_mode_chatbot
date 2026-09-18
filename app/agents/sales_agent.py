from langchain_google_genai import ChatGoogleGenerativeAI

from app.prompts.sales_prompt import SALES_SYSTEM_PROMPT


def sales_agent(query, context, chat_history=None):
    """
    Sales Management Assistant.

    Answers questions using only the retrieved sales documents.
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
{SALES_SYSTEM_PROMPT}

SALES MATERIAL

{context}

PREVIOUS CONVERSATION

{history_text}

USER QUESTION

{query}

Answer the user's question now.

Remember:
- Behave like a professional Sales Management Assistant.
- Use only the provided sales material.
- Do not use tutor/education information.
- Do not invent prices, products, policies, features, or procedures.
- If the information is not available, clearly say that it is not
  available in the uploaded sales documents.
"""

    result = llm.invoke(prompt)

    return result.content