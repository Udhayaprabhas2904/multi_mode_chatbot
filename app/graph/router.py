def mode_router(state):

    mode = state.get("mode")

    if mode == "sales":
        return "sales"

    if mode == "tutor":
        return "tutor"

    raise ValueError(
        "Invalid mode. Use 'sales' or 'tutor'."
    )