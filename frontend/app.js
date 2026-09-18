/* =========================================================
   GLOBAL STATE
========================================================= */

let currentMode = "sales";

let selectedDocumentId = null;

let selectedFile = null;

let socket = null;

let waitingForResponse = false;


/* =========================================================
   API
========================================================= */

const API = window.location.origin;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDocuments();

        setupDropZone();

        setupTheme();

    }
);


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

    }


    const themeButton =
        document.getElementById("themeBtn");


    themeButton.addEventListener(
        "click",
        toggleTheme
    );

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const theme =
        document.body.classList.contains("dark")
            ? "dark"
            : "light";


    localStorage.setItem(
        "theme",
        theme
    );

}


/* =========================================================
   MODE
========================================================= */

function setMode(mode) {

    currentMode = mode;


    const salesButton =
        document.getElementById(
            "salesModeBtn"
        );


    const tutorButton =
        document.getElementById(
            "tutorModeBtn"
        );


    salesButton.classList.toggle(
        "active",
        mode === "sales"
    );


    tutorButton.classList.toggle(
        "active",
        mode === "tutor"
    );


    const activeModeLabel =
        document.getElementById(
            "activeModeLabel"
        );


    activeModeLabel.textContent =
        mode === "sales"
            ? "Sales"
            : "AI Tutor";


    const inputModeText =
        document.getElementById(
            "inputModeText"
        );


    inputModeText.textContent =
        mode === "sales"
            ? "Sales"
            : "AI Tutor";


    const inputModeIcon =
        document.getElementById(
            "inputModeIcon"
        );


    inputModeIcon.textContent =
        mode === "sales"
            ? "▣"
            : "◆";


    const input =
        document.getElementById(
            "messageInput"
        );


    if (selectedDocumentId) {

        input.placeholder =
            mode === "sales"
                ? "Ask about your sales document..."
                : "Ask about your study document...";

    } else {

        input.placeholder =
            "Upload a PDF to activate chat...";

    }


    updateChatSubtitle();

}


/* =========================================================
   MODE MENU
========================================================= */

function toggleModeMenu() {

    const menu =
        document.getElementById(
            "modeMenu"
        );


    menu.classList.toggle(
        "hidden"
    );

}


/* =========================================================
   DROP ZONE
========================================================= */

function setupDropZone() {

    const zone =
        document.getElementById(
            "dropZone"
        );


    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            zone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    zone.classList.add(
                        "dragging"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            zone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    zone.classList.remove(
                        "dragging"
                    );

                }
            );

        }
    );


    zone.addEventListener(
        "drop",
        event => {

            const file =
                event.dataTransfer.files?.[0];


            if (file) {

                selectFile(file);

            }

        }
    );

}


/* =========================================================
   FILE SELECT
========================================================= */

function handleFileSelect(event) {

    const file =
        event.target.files?.[0];


    if (file) {

        selectFile(file);

    }

}


function selectFile(file) {

    const isPDF =
        file.type === "application/pdf"
        ||
        file.name
            .toLowerCase()
            .endsWith(".pdf");


    if (!isPDF) {

        showUploadStatus(
            "Please select a PDF file.",
            true
        );

        return;

    }


    const maxSize =
        1024 *
        1024 *
        1024;


    if (file.size > maxSize) {

        showUploadStatus(
            "The selected file is larger than 1 GB.",
            true
        );

        return;

    }


    selectedFile = file;


    const selectedFileElement =
        document.getElementById(
            "selectedFile"
        );


    selectedFileElement.textContent =
        `Selected: ${file.name} (${formatBytes(file.size)})`;


    selectedFileElement.classList.remove(
        "hidden"
    );


    showUploadStatus(
        "PDF ready for indexing.",
        false,
        false
    );

}


/* =========================================================
   UPLOAD PDF
========================================================= */

async function uploadPDF() {

    if (!selectedFile) {

        showUploadStatus(
            "Choose a PDF first.",
            true
        );

        return;

    }


    const uploadMode =
        document.getElementById(
            "uploadMode"
        ).value;


    const button =
        document.getElementById(
            "uploadBtn"
        );


    button.disabled = true;


    button.innerHTML =
        "<span>…</span> Indexing document...";


    showUploadStatus(
        "Extracting text → chunking → creating embeddings → storing vectors...",
        false,
        false
    );


    const formData =
        new FormData();


    formData.append(
        "file",
        selectedFile
    );


    formData.append(
        "mode",
        uploadMode
    );


    try {

        const response =
            await fetch(
                `${API}/api/documents/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Upload failed."
            );

        }


        selectedDocumentId =
            data.document_id;


        currentMode =
            data.mode;


        setMode(
            currentMode
        );


        showUploadStatus(
            "PDF indexed successfully. Chat is ready.",
            false,
            true
        );


        clearChat();


        await loadDocuments();


        activateChat();


    } catch (error) {

        showUploadStatus(
            error.message,
            true
        );

    } finally {

        button.disabled = false;


        button.innerHTML =
            "<span>⇧</span> Upload & Index PDF";

    }

}


/* =========================================================
   LOAD DOCUMENTS
========================================================= */

async function loadDocuments() {

    try {

        const response =
            await fetch(
                `${API}/api/documents`
            );


        const data =
            await response.json();


        renderDocuments(
            data.documents || []
        );

    } catch (error) {

        console.error(
            "Failed to load documents:",
            error
        );

    }

}


/* =========================================================
   RENDER DOCUMENTS
========================================================= */

function renderDocuments(documents) {

    const container =
        document.getElementById(
            "uploadedDocuments"
        );


    if (!documents.length) {

        container.innerHTML = `

            <div class="empty-docs">

                <span>
                    □
                </span>

                <p>
                    No documents uploaded yet.
                </p>

                <small>
                    Upload a PDF to activate chat.
                </small>

            </div>

        `;

        return;

    }


    container.innerHTML =
        documents.map(
            document => {

                const selected =
                    Number(document.id)
                    ===
                    Number(selectedDocumentId);


                let statusIcon = "…";


                if (
                    document.status
                    ===
                    "completed"
                ) {

                    statusIcon = "✓";

                }


                if (
                    document.status
                    ===
                    "failed"
                ) {

                    statusIcon = "!";

                }


                return `

                    <div
                        class="document-item
                        ${selected ? "selected" : ""}"
                        onclick="selectDocument(
                            ${document.id},
                            '${escapeHtml(document.mode)}'
                        )"
                    >

                        <div class="doc-icon">
                            PDF
                        </div>


                        <div class="doc-info">

                            <strong
                                title="${escapeHtml(document.filename)}"
                            >
                                ${escapeHtml(document.filename)}
                            </strong>


                            <small>

                                ${formatBytes(document.file_size)}

                                •
                                
                                ${document.pages || 0}
                                pages

                                •

                                ${escapeHtml(document.mode)}

                            </small>

                        </div>


                        <div
                            class="
                                doc-status
                                ${document.status}
                            "
                        >
                            ${statusIcon}
                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   SELECT DOCUMENT
========================================================= */

function selectDocument(
    id,
    mode
) {

    selectedDocumentId =
        id;


    currentMode =
        mode;


    setMode(
        mode
    );


    activateChat();


    loadDocuments();

}


/* =========================================================
   ACTIVATE CHAT
========================================================= */

function activateChat() {

    const input =
        document.getElementById(
            "messageInput"
        );


    const sendButton =
        document.getElementById(
            "sendButton"
        );


    input.disabled = false;

    sendButton.disabled = false;


    const status =
        document.getElementById(
            "chatStatus"
        );


    status.classList.remove(
        "inactive"
    );


    status.classList.add(
        "active"
    );


    document.getElementById(
        "chatStatusText"
    ).textContent =
        "Chat active";


    input.focus();


    updateChatSubtitle();

}


/* =========================================================
   CHAT SUBTITLE
========================================================= */

function updateChatSubtitle() {

    const subtitle =
        document.getElementById(
            "chatSubtitle"
        );


    if (!selectedDocumentId) {

        subtitle.textContent =
            "Upload a PDF to start chatting";

        return;

    }


    subtitle.textContent =
        currentMode === "sales"
            ? "Sales Assistant • RAG knowledge base"
            : "AI Tutor • RAG knowledge base";

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKey(event) {

    if (
        event.key === "Enter"
        &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

}


/* =========================================================
   WEBSOCKET
========================================================= */

function ensureSocket() {

    return new Promise(
        (resolve, reject) => {

            if (
                socket
                &&
                socket.readyState
                ===
                WebSocket.OPEN
            ) {

                resolve();

                return;

            }


            const protocol =
                location.protocol === "https:"
                    ? "wss"
                    : "ws";


            socket =
                new WebSocket(
                    `${protocol}://${location.host}/api/ws/chat`
                );


            socket.onopen =
                () => {

                    resolve();

                };


            socket.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not connect to chat server."
                        )
                    );

                };

        }
    );

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );


    const question =
        input.value.trim();


    if (
        !question
        ||
        !selectedDocumentId
        ||
        waitingForResponse
    ) {

        return;

    }


    waitingForResponse =
        true;


    document.getElementById(
        "sendButton"
    ).disabled = true;


    hideEmptyChat();


    addMessage(
        "user",
        question
    );


    input.value = "";


    const assistantBubble =
        addMessage(
            "assistant",
            "",
            true
        );


    let answerText = "";


    try {

        await ensureSocket();


        socket.onmessage =
            event => {

                const data =
                    JSON.parse(
                        event.data
                    );


                /* ==============================
                   STATUS
                =============================== */

                if (
                    data.type
                    ===
                    "status"
                ) {

                    setTypingStatus(
                        assistantBubble,
                        data.message
                    );

                }


                /* ==============================
                   TOKEN
                =============================== */

                if (
                    data.type
                    ===
                    "token"
                ) {

                    answerText +=
                        data.content;


                    updateAssistantMessage(
                        assistantBubble,
                        answerText
                    );

                }


                /* ==============================
                   DONE
                =============================== */

                if (
                    data.type
                    ===
                    "done"
                ) {

                    removeTyping(
                        assistantBubble
                    );


                    addSources(
                        assistantBubble,
                        data.sources || []
                    );


                    waitingForResponse =
                        false;


                    document.getElementById(
                        "sendButton"
                    ).disabled = false;

                }


                /* ==============================
                   ERROR
                =============================== */

                if (
                    data.type
                    ===
                    "error"
                ) {

                    updateAssistantMessage(
                        assistantBubble,
                        `Sorry, I couldn't process that request.

${data.message}`
                    );


                    waitingForResponse =
                        false;


                    document.getElementById(
                        "sendButton"
                    ).disabled = false;

                }

            };


        socket.send(
            JSON.stringify({

                question:
                    question,

                mode:
                    currentMode,

                document_id:
                    selectedDocumentId

            })
        );


    } catch (error) {

        updateAssistantMessage(
            assistantBubble,
            error.message
        );


        waitingForResponse =
            false;


        document.getElementById(
            "sendButton"
        ).disabled = false;

    }

}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    role,
    text,
    typing = false
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        `message ${role}`;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "bubble";


    if (typing) {

        bubble.innerHTML = `

            <div class="typing">

                <span></span>

                <span></span>

                <span></span>

            </div>

        `;

    } else {

        bubble.textContent =
            text;

    }


    wrapper.appendChild(
        bubble
    );


    document
        .getElementById(
            "chatMessages"
        )
        .appendChild(
            wrapper
        );


    scrollChat();


    return wrapper;

}


/* =========================================================
   UPDATE ASSISTANT MESSAGE
========================================================= */

function updateAssistantMessage(
    wrapper,
    text
) {

    const bubble =
        wrapper.querySelector(
            ".bubble"
        );


    bubble.textContent =
        text;


    scrollChat();

}


/* =========================================================
   TYPING STATUS
========================================================= */

function setTypingStatus(
    wrapper,
    status
) {

    const bubble =
        wrapper.querySelector(
            ".bubble"
        );


    bubble.innerHTML = `

        <div class="typing">

            <span></span>

            <span></span>

            <span></span>

        </div>

    `;


    wrapper.dataset.status =
        status;

}


/* =========================================================
   REMOVE TYPING
========================================================= */

function removeTyping(
    wrapper
) {

    const typing =
        wrapper.querySelector(
            ".typing"
        );


    if (typing) {

        typing.remove();

    }

}


/* =========================================================
   SOURCES
========================================================= */

function addSources(
    wrapper,
    sources
) {

    if (
        !sources
        ||
        !sources.length
    ) {

        return;

    }


    const sourceBox =
        document.createElement(
            "div"
        );


    sourceBox.className =
        "sources";


    sourceBox.innerHTML =
        sources.map(
            source => `

                <span class="source-chip">

                    ${escapeHtml(
                        source.filename
                    )}

                    •

                    Page

                    ${escapeHtml(
                        String(source.page)
                    )}

                </span>

            `
        ).join("");


    wrapper.appendChild(
        sourceBox
    );


    scrollChat();

}


/* =========================================================
   HIDE EMPTY CHAT
========================================================= */

function hideEmptyChat() {

    const emptyChat =
        document.getElementById(
            "emptyChat"
        );


    if (emptyChat) {

        emptyChat.remove();

    }

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function clearChat() {

    document.getElementById(
        "chatMessages"
    ).innerHTML = "";

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChat() {

    const chat =
        document.getElementById(
            "chatMessages"
        );


    chat.scrollTop =
        chat.scrollHeight;

}


/* =========================================================
   UPLOAD STATUS
========================================================= */

function showUploadStatus(
    message,
    error = false,
    success = false
) {

    const status =
        document.getElementById(
            "uploadStatus"
        );


    status.textContent =
        message;


    status.className =
        "upload-status";


    if (error) {

        status.classList.add(
            "error"
        );

    }


    if (success) {

        status.classList.add(
            "success"
        );

    }

}


/* =========================================================
   FORMAT FILE SIZE
========================================================= */

function formatBytes(
    bytes
) {

    if (!bytes) {

        return "0 B";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes)
            /
            Math.log(1024)
        );


    return `${
        (
            bytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(
            index ? 1 : 0
        )
    } ${units[index]}`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.setMode =
    setMode;

window.toggleModeMenu =
    toggleModeMenu;

window.handleFileSelect =
    handleFileSelect;

window.uploadPDF =
    uploadPDF;

window.selectDocument =
    selectDocument;

window.handleKey =
    handleKey;

window.sendMessage =
    sendMessage;