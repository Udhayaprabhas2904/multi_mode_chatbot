from langgraph.graph import StateGraph, START, END

from app.graph.state import GraphState

from app.graph.nodes import (
    query_analyzer,
    document_retriever,
    context_builder,
    sales_node,
    tutor_node,
    response_validator,
)

from app.graph.router import mode_router


def build_graph():

    graph = StateGraph(GraphState)

    graph.add_node(
        "query_analyzer",
        query_analyzer
    )

    graph.add_node(
        "document_retriever",
        document_retriever
    )

    graph.add_node(
        "context_builder",
        context_builder
    )

    graph.add_node(
        "sales_agent",
        sales_node
    )

    graph.add_node(
        "tutor_agent",
        tutor_node
    )

    graph.add_node(
        "response_validator",
        response_validator
    )

    graph.add_edge(
        START,
        "query_analyzer"
    )

    graph.add_edge(
        "query_analyzer",
        "document_retriever"
    )

    graph.add_edge(
        "document_retriever",
        "context_builder"
    )

    graph.add_conditional_edges(
        "context_builder",
        mode_router,
        {
            "sales": "sales_agent",
            "tutor": "tutor_agent",
        }
    )

    graph.add_edge(
        "sales_agent",
        "response_validator"
    )

    graph.add_edge(
        "tutor_agent",
        "response_validator"
    )

    graph.add_edge(
        "response_validator",
        END
    )

    return graph.compile()