/* GLOBAL STATE */

let currentMode = "sales";

let selectedFile = null;

let isUploading = false;

let isSending = false;

let socket = null;

let socketConnected = false;

let reconnectTimer = null;

let uploadedDocuments = [];

let chatHistory = [];

let currentDocumentId = null;

let hasUploadedDocument = false;

let currentAssistantMessage = null;


/* DOM HELPER  */

function $(id) {
    return document.getElementById(id);
}


/* DOM ELEMENTS */

const salesModeBtn = $("salesModeBtn");
const tutorModeBtn = $("tutorModeBtn");

const activeModeLabel = $("activeModeLabel");

const inputModeButton = $("inputModeButton");
const inputModeText = $("inputModeText");
const inputModeIcon = $("inputModeIcon");
const modeMenu = $("modeMenu");

const pdfFile = $("pdfFile");
const dropZone = $("dropZone");
const selectedFileBox = $("selectedFile");

const uploadMode = $("uploadMode");
const uploadBtn = $("uploadBtn");
const uploadStatus = $("uploadStatus");

const uploadedDocumentsBox = $("uploadedDocuments");

const chatMessages = $("chatMessages");
const emptyChat = $("emptyChat");

const messageInput = $("messageInput");
const sendButton = $("sendButton");

const chatStatus = $("chatStatus");
const chatStatusText = $("chatStatusText");

const chatSubtitle = $("chatSubtitle");

const themeBtn = $("themeBtn");


/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", () => {

    
    console.log("RAG FRONTEND INITIALIZING");
   

    initializeTheme();

    initializeMode();

    initializeFileUpload();

    initializeComposer();


    disableChat();

    loadDocuments();

    updateChatUI();

    console.log("Current mode:", currentMode);
    console.log("Chat unlocked:", hasUploadedDocument);

    console.log(
        "Multi-Mode RAG Assistant initialized."
    );
});


/* THEME */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem("rag-theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");
    }

    updateThemeIcon();
}


function toggleTheme() {

    document.body.classList.toggle("dark");

    const isDark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "rag-theme",
        isDark ? "dark" : "light"
    );

    updateThemeIcon();
}


function updateThemeIcon() {

    if (!themeBtn) {
        return;
    }

    const isDark =
        document.body.classList.contains("dark");

    const sunIcon =
        themeBtn.querySelector(".sun-icon");

    const moonIcon =
        themeBtn.querySelector(".moon-icon");

    if (sunIcon) {

        sunIcon.style.display =
            isDark ? "none" : "block";
    }

    if (moonIcon) {

        moonIcon.style.display =
            isDark ? "block" : "none";
    }
}


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        toggleTheme
    );
}


/* MODE INITIALIZATION */

function initializeMode() {

    setMode(
        "sales",
        false
    );
}


/* MODE SWITCHING */

function setMode(
    mode,
    addSystemMessage = true
) {

    if (
        mode !== "sales" &&
        mode !== "tutor"
    ) {

        console.warn(
            "Invalid mode:",
            mode
        );

        return;
    }

    const oldMode =
        currentMode;

    currentMode =
        mode;

    updateModeButtons();

    updateActiveMode();

    updateComposerMode();

    updateChatSubtitle();

    updateChatUI();

    if (
        addSystemMessage &&
        oldMode !== mode &&
        chatHistory.length > 0
    ) {

        addModeChangeMessage(
            mode
        );
    }

    if (modeMenu) {

        modeMenu.classList.add(
            "hidden"
        );
    }

    console.log(
        "Current mode:",
        currentMode
    );
}


/* MODE BUTTONS */

function updateModeButtons() {

    if (salesModeBtn) {

        salesModeBtn.classList.toggle(
            "active",
            currentMode === "sales"
        );
    }

    if (tutorModeBtn) {

        tutorModeBtn.classList.toggle(
            "active",
            currentMode === "tutor"
        );
    }
}


/* ACTIVE MODE */

function updateActiveMode() {

    if (!activeModeLabel) {
        return;
    }

    activeModeLabel.textContent =
        currentMode === "sales"
            ? "Sales"
            : "AI Tutor";
}


/* COMPOSER MODE */

function updateComposerMode() {

    if (inputModeText) {

        inputModeText.textContent =
            currentMode === "sales"
                ? "Sales"
                : "AI Tutor";
    }

    if (inputModeIcon) {

        inputModeIcon.innerHTML =
            currentMode === "sales"
                ? salesIcon()
                : tutorIcon();
    }
}


/* CHAT SUBTITLE */

function updateChatSubtitle() {

    if (!chatSubtitle) {
        return;
    }

    chatSubtitle.textContent =
        currentMode === "sales"
            ? "Sales Management Assistant"
            : "AI Tutor • Learn from your documents";
}


/* MODE ICONS */

function salesIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M6 8.5h12v10H6z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M9 8.5V6.8A1.8 1.8 0 0 1 10.8 5
                   h2.4A1.8 1.8 0 0 1 15 6.8v1.7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            />
        </svg>
    `;
}


function tutorIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M3.5 7.5 12 4l8.5 3.5L12 11
                   3.5 7.5Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M6.5 9v5.2c0 1.4 2.5 2.8 5.5 2.8
                   s5.5-1.4 5.5-2.8V9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            />
        </svg>
    `;
}


/* MODE MENU */

function toggleModeMenu() {

    if (!modeMenu) {
        return;
    }

    modeMenu.classList.toggle(
        "hidden"
    );
}


document.addEventListener(
    "click",
    (event) => {

        if (
            !modeMenu ||
            !inputModeButton
        ) {
            return;
        }

        const insideButton =
            inputModeButton.contains(
                event.target
            );

        const insideMenu =
            modeMenu.contains(
                event.target
            );

        if (
            !insideButton &&
            !insideMenu
        ) {

            modeMenu.classList.add(
                "hidden"
            );
        }
    }
);


/* FILE UPLOAD */

function initializeFileUpload() {

    if (!dropZone) {
        return;
    }

    dropZone.addEventListener(
        "dragover",
        handleDragOver
    );

    dropZone.addEventListener(
        "dragleave",
        handleDragLeave
    );

    dropZone.addEventListener(
        "drop",
        handleDrop
    );
}


function handleDragOver(event) {

    event.preventDefault();

    dropZone.classList.add(
        "drag-over"
    );
}


function handleDragLeave(event) {

    event.preventDefault();

    dropZone.classList.remove(
        "drag-over"
    );
}


function handleDrop(event) {

    event.preventDefault();

    dropZone.classList.remove(
        "drag-over"
    );

    const files =
        event.dataTransfer.files;

    if (
        !files ||
        files.length === 0
    ) {
        return;
    }

    processSelectedFile(
        files[0]
    );
}


/* FILE SELECTION */

function handleFileSelect(event) {

    const files =
        event.target.files;

    if (
        !files ||
        files.length === 0
    ) {
        return;
    }

    processSelectedFile(
        files[0]
    );
}


function processSelectedFile(file) {

    clearUploadStatus();

    if (!file) {
        return;
    }

    const isPDF =
        file.type === "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf");

    if (!isPDF) {

        selectedFile = null;

        setUploadStatus(
            "Please select a PDF file.",
            "error"
        );

        return;
    }

    const maxSize =
        1024 * 1024 * 1024;

    if (file.size > maxSize) {

        selectedFile = null;

        setUploadStatus(
            "The PDF exceeds the maximum 1 GB file size.",
            "error"
        );

        return;
    }

    selectedFile =
        file;

    showSelectedFile(
        file
    );

    setUploadStatus(
        "PDF selected. Choose the document type and upload.",
        "success"
    );

    console.log(
        "Selected PDF:",
        file.name,
        formatFileSize(file.size)
    );
}


function showSelectedFile(file) {

    if (!selectedFileBox) {
        return;
    }

    selectedFileBox.classList.remove(
        "hidden"
    );

    selectedFileBox.innerHTML = `
        <strong>
            ${escapeHtml(file.name)}
        </strong>

        <span>
            • ${formatFileSize(file.size)}
        </span>
    `;
}


/* FILE SIZE */

function formatFileSize(bytes) {

    if (!bytes) {
        return "0 KB";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    let size =
        bytes;

    let unitIndex =
        0;

    while (
        size >= 1024 &&
        unitIndex < units.length - 1
    ) {

        size /= 1024;

        unitIndex++;
    }

    return `${size.toFixed(
        size >= 10 ? 0 : 1
    )} ${units[unitIndex]}`;
}


/* UPLOAD PDF */

async function uploadPDF() {

    if (isUploading) {
        return;
    }

    if (!selectedFile) {

        setUploadStatus(
            "Please choose a PDF file first.",
            "error"
        );

        return;
    }

    const mode =
        uploadMode
            ? uploadMode.value
            : currentMode;

    if (
        mode !== "sales" &&
        mode !== "tutor"
    ) {

        setUploadStatus(
            "Please select a valid document type.",
            "error"
        );

        return;
    }

    isUploading = true;

    setUploadButtonState(
        true
    );

    setUploadStatus(
        "Uploading and indexing PDF...",
        "loading"
    );

   
    console.log("PDF UPLOAD START");
    console.log("File:", selectedFile.name);
    console.log("Mode:", mode);
    
    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            selectedFile
        );

        formData.append(
            "mode",
            mode
        );

        const response =
            await fetch(
                "/api/documents/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await parseJSONSafe(
                response
            );

        console.log(
            "Upload HTTP status:",
            response.status
        );

        console.log(
            "Upload response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                data?.message ||
                `Upload failed (${response.status}).`
            );
        }

        /*
         * VERY IMPORTANT:
         *
         * Unlock chat immediately after the backend
         * confirms successful upload/indexing.
         *
         * We no longer depend on /api/documents
         * returning the document correctly at this moment.
         */
        hasUploadedDocument = true;

        currentDocumentId =
            data?.document_id ||
            data?.id ||
            currentDocumentId;

        setUploadStatus(
            data?.message ||
            "PDF indexed successfully. Chat is ready.",
            "success"
        );

        console.log(
            "CHAT UNLOCKED AFTER SUCCESSFUL UPLOAD"
        );

        selectedFile = null;

        if (pdfFile) {

            pdfFile.value =
                "";
        }

        if (selectedFileBox) {

            selectedFileBox.classList.add(
                "hidden"
            );

            selectedFileBox.textContent =
                "";
        }

        /*
         * Enable chat NOW.
         */
        enableChat();

        /*
         * Refresh document list.
         *
         * Even if this request has a temporary problem,
         * chat remains unlocked because upload already
         * succeeded.
         */
        try {

            await loadDocuments();

        } catch (documentError) {

            console.warn(
                "Document list refresh failed after upload:",
                documentError
            );

            /*
             * Do NOT lock chat again.
             */
            hasUploadedDocument = true;

            enableChat();
        }

        /*
         * Connect chat.
         */
        connectWebSocket();

    } catch (error) {

        console.error(
            "UPLOAD ERROR:",
            error
        );

        setUploadStatus(
            getFriendlyErrorMessage(
                error,
                "PDF upload failed."
            ),
            "error"
        );

    } finally {

        isUploading = false;

        setUploadButtonState(
            false
        );
    }
}


/* UPLOAD BUTTON */

function setUploadButtonState(
    disabled
) {

    if (!uploadBtn) {
        return;
    }

    uploadBtn.disabled =
        disabled;

    const span =
        uploadBtn.querySelector(
            "span"
        );

    if (span) {

        span.textContent =
            disabled
                ? "Uploading..."
                : "Upload & Index PDF";
    }
}


/* UPLOAD STATUS */

function setUploadStatus(
    message,
    type = ""
) {

    if (!uploadStatus) {
        return;
    }

    uploadStatus.textContent =
        message || "";

    uploadStatus.classList.remove(
        "error",
        "success",
        "loading"
    );

    if (type) {

        uploadStatus.classList.add(
            type
        );
    }
}


function clearUploadStatus() {

    setUploadStatus(
        "",
        ""
    );
}


/* DOCUMENT LIST */

async function loadDocuments() {

    if (!uploadedDocumentsBox) {
        return;
    }

    console.log(
        "Loading uploaded documents..."
    );

    try {

        const response =
            await fetch(
                "/api/documents",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        const data =
            await parseJSONSafe(
                response
            );

        console.log(
            "Documents HTTP status:",
            response.status
        );

        console.log(
            "Documents response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                `Document API returned ${response.status}`
            );
        }

        if (Array.isArray(data)) {

            uploadedDocuments =
                data;

        } else if (
            Array.isArray(data?.documents)
        ) {

            uploadedDocuments =
                data.documents;

        } else {

            uploadedDocuments =
                [];
        }

        console.log(
            "Documents found:",
            uploadedDocuments.length
        );

        /*
         * If backend confirms existing documents,
         * unlock chat.
         */
        if (
            uploadedDocuments.length > 0
        ) {

            hasUploadedDocument = true;

            const latest =
                uploadedDocuments[
                    uploadedDocuments.length - 1
                ];

            currentDocumentId =
                currentDocumentId ||
                latest?.document_id ||
                latest?.id ||
                null;

            console.log(
                "Existing document found. Chat unlocked."
            );

        } else {

            /*
             * Only lock if there has never been a
             * successful upload in this page session.
             */
            if (!hasUploadedDocument) {

                hasUploadedDocument = false;

                console.log(
                    "No uploaded documents. Chat locked."
                );
            }
        }

        renderDocuments();

        updateChatUI();

        /*
         * Connect only if chat is unlocked.
         */
        if (hasUploadedDocument) {

            connectWebSocket();
        }

    } catch (error) {

        console.error(
            "LOAD DOCUMENTS ERROR:",
            error
        );

        uploadedDocumentsBox.innerHTML = `
            <div class="empty-docs">

                <div class="empty-doc-icon">
                    !
                </div>

                <p>
                    Could not load documents.
                </p>

                <small>
                    ${escapeHtml(
                        error.message ||
                        "Please refresh the page."
                    )}
                </small>

            </div>
        `;

        /*
         * IMPORTANT:
         *
         * If a PDF was already successfully uploaded
         * during this page session, do NOT lock chat
         * just because the document-list request failed.
         */
        if (hasUploadedDocument) {

            enableChat();

        } else {

            disableChat();
        }
    }
}


/* RENDER DOCUMENTS */

function renderDocuments() {

    if (!uploadedDocumentsBox) {
        return;
    }

    if (
        !uploadedDocuments ||
        uploadedDocuments.length === 0
    ) {

        uploadedDocumentsBox.innerHTML = `
            <div class="empty-docs">

                <div class="empty-doc-icon">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M6 3.5h8l4 4V20.5H6z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"
                        />

                        <path
                            d="M14 3.5v4h4"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"
                        />
                    </svg>
                </div>

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

    uploadedDocumentsBox.innerHTML =
        uploadedDocuments
            .map(
                (document, index) =>
                    renderDocumentItem(
                        document,
                        index
                    )
            )
            .join("");
}


function renderDocumentItem(
    document,
    index
) {

    const name =
        document.name ||
        document.filename ||
        document.file_name ||
        document.source ||
        `Document ${index + 1}`;

    const mode =
        document.mode ||
        document.document_type ||
        "unknown";

    const status =
        document.status ||
        "completed";

    const modeLabel =
        mode === "sales"
            ? "Sales"
            : mode === "tutor"
                ? "Education"
                : mode;

    const statusClass =
        String(status)
            .toLowerCase();

    return `
        <div
            class="document-item ${statusClass}"
            data-index="${index}"
        >

            <div class="document-icon">
                <span>PDF</span>
            </div>

            <div class="document-info">

                <span
                    class="document-name"
                    title="${escapeHtml(name)}"
                >
                    ${escapeHtml(name)}
                </span>

                <div class="document-meta">

                    <span>
                        ${escapeHtml(modeLabel)}
                    </span>

                </div>

            </div>

            <div
                class="document-status ${statusClass}"
            >
                ${getDocumentStatusIcon(status)}
            </div>

        </div>
    `;
}


function getDocumentStatusIcon(
    status
) {

    const normalized =
        String(status)
            .toLowerCase();

    if (
        normalized === "failed" ||
        normalized === "error"
    ) {

        return "✕";
    }

    if (
        normalized === "processing" ||
        normalized === "pending" ||
        normalized === "indexing"
    ) {

        return "…";
    }

    return "✓";
}


/* COMPOSER */

function initializeComposer() {

    updateComposerMode();

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            updateSendButton
        );
    }

    updateSendButton();
}


/* ENABLE CHAT */

function enableChat() {

    hasUploadedDocument = true;

    if (messageInput) {

        messageInput.disabled =
            false;

        messageInput.placeholder =
            "Ask something about your document...";
    }

    setChatStatus(
        true,
        socketConnected
            ? "Chat connected"
            : "Chat ready"
    );

    updateChatSubtitle();

    updateSendButton();

    console.log(
        "CHAT ENABLED"
    );
}


/* DISABLE CHAT */

function disableChat() {

    /*
     * Do not modify hasUploadedDocument here if the
     * backend upload already succeeded.
     */
    if (!hasUploadedDocument) {

        if (messageInput) {

            messageInput.disabled =
                true;

            messageInput.placeholder =
                "Upload a PDF to activate chat...";
        }

        if (sendButton) {

            sendButton.disabled =
                true;
        }

        setChatStatus(
            false,
            "Upload a PDF to start chatting"
        );
    }
}


/* CHAT STATUS */

function setChatStatus(
    active,
    text
) {

    if (!chatStatus) {
        return;
    }

    chatStatus.classList.toggle(
        "active",
        active
    );

    chatStatus.classList.toggle(
        "inactive",
        !active
    );

    if (chatStatusText) {

        chatStatusText.textContent =
            text ||
            (
                active
                    ? "Chat ready"
                    : "Chat inactive"
            );
    }
}


/* CHAT UI */

function updateChatUI() {

    if (
        !messageInput ||
        !sendButton
    ) {
        return;
    }

    if (hasUploadedDocument) {

        enableChat();

    } else {

        disableChat();
    }

    updateSendButton();
}


/* SEND BUTTON */

function updateSendButton() {

    if (!sendButton) {
        return;
    }

    const hasText =
        messageInput &&
        messageInput.value.trim().length > 0;

    sendButton.disabled =
        !hasText ||
        isSending ||
        !hasUploadedDocument ||
        (
            messageInput &&
            messageInput.disabled
        );
}


/* KEYBOARD */

function handleKey(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


/* SEND MESSAGE */

async function sendMessage() {

    if (isSending) {
        return;
    }

    if (!messageInput) {
        return;
    }

    /*
     * HARD SAFETY CHECK:
     *
     * No uploaded document = no chat.
     */
    if (!hasUploadedDocument) {

        console.warn(
            "SEND BLOCKED: No uploaded document."
        );

        setChatStatus(
            false,
            "Upload a PDF to start chatting"
        );

        return;
    }

    const question =
        messageInput.value.trim();

    if (!question) {
        return;
    }

    /*
     * Make sure socket exists.
     */
    if (
        !socket ||
        socket.readyState !== WebSocket.OPEN
    ) {

        console.log(
            "WebSocket not ready. Connecting..."
        );

        connectWebSocket();

        addAssistantMessage(
            "Connecting to the chat server. Please try again in a moment."
        );

        return;
    }

    isSending =
        true;

    updateSendButton();

    /*
     * Capture mode at send time.
     *
     * This allows:
     *
     * Sales → Tutor → Sales
     *
     * inside the same chat.
     */
    const messageMode =
        currentMode;

    addUserMessage(
        question,
        messageMode
    );

    chatHistory.push({
        role: "user",
        content: question,
        mode: messageMode
    });

    messageInput.value =
        "";

    updateSendButton();

    showSearchingMessage(
        "Thinking..."
    );

    /*
     * Backend expects:
     *
     * {
     *     question: "...",
     *     mode: "sales" | "tutor"
     * }
     *
     * document_id is NOT required.
     */
    const payload = {
    question: question,
    mode: messageMode,
    document_id: currentDocumentId
};

    

    console.log(
        "SEND → WebSocket"
    );

    console.log(
        payload
    );

   

    try {

        socket.send(
            JSON.stringify(payload)
        );

    } catch (error) {

        console.error(
            "WEBSOCKET SEND ERROR:",
            error
        );

        removeSearchingMessage();

        addAssistantMessage(
            getFriendlyErrorMessage(
                error,
                "I could not send your question."
            )
        );

        isSending =
            false;

        updateSendButton();
    }
}


/* WEBSOCKET CONNECTION */

function connectWebSocket() {

    /*
     * Never connect before a document exists.
     */
    if (!hasUploadedDocument) {

        console.log(
            "WebSocket connection skipped: no document uploaded."
        );

        return;
    }

    if (
        socket &&
        (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        )
    ) {

        return;
    }

    clearTimeout(
        reconnectTimer
    );

    try {

        const protocol =
            window.location.protocol === "https:"
                ? "wss:"
                : "ws:";

        /*
         * FastAPI:
         *
         * @router.websocket("/ws/chat")
         *
         * Therefore:
         *
         * /ws/chat
         */
        const wsUrl =
            `${protocol}//${window.location.host}/ws/chat`;

        console.log(
            "Connecting WebSocket:",
            wsUrl
        );

        socket =
            new WebSocket(
                wsUrl
            );

        socket.onopen =
            handleSocketOpen;

        socket.onmessage =
            handleWebSocketMessage;

        socket.onerror =
            handleSocketError;

        socket.onclose =
            handleSocketClose;

    } catch (error) {

        console.error(
            "WEBSOCKET CONNECTION ERROR:",
            error
        );

        socketConnected =
            false;

        setChatStatus(
            false,
            "Chat connection failed"
        );
    }
}


/* SOCKET OPEN */

function handleSocketOpen() {

    console.log(
        "WebSocket connected."
    );

    socketConnected =
        true;

    setChatStatus(
        true,
        "Chat connected"
    );

    updateSendButton();
}


/* SOCKET ERROR */

function handleSocketError(
    error
) {

    console.error(
        "WebSocket error:",
        error
    );

    socketConnected =
        false;

    setChatStatus(
        false,
        "Chat connection error"
    );
}


/* SOCKET CLOSE */

function handleSocketClose(
    event
) {

    console.warn(
        "WebSocket closed:",
        event.code,
        event.reason
    );

    socketConnected =
        false;

    socket =
        null;

    if (isSending) {

        removeSearchingMessage();

        addAssistantMessage(
            "The chat connection was lost before the response was completed."
        );

        isSending =
            false;

        updateSendButton();
    }

    /*
     * Only reconnect if a document exists.
     */
    if (hasUploadedDocument) {

        setChatStatus(
            false,
            "Reconnecting..."
        );

        scheduleReconnect();

    } else {

        setChatStatus(
            false,
            "Upload a PDF to start chatting"
        );
    }
}


/* RECONNECT */

function scheduleReconnect() {

    clearTimeout(
        reconnectTimer
    );

    if (!hasUploadedDocument) {
        return;
    }

    reconnectTimer =
        setTimeout(
            () => {

                if (
                    !socketConnected &&
                    hasUploadedDocument
                ) {

                    connectWebSocket();
                }

            },
            3000
        );
}


/* WEBSOCKET MESSAGE */

function handleWebSocketMessage(
    event
) {

    let data;

    try {

        data =
            JSON.parse(
                event.data
            );

    } catch (error) {

        console.error(
            "Invalid WebSocket JSON:",
            event.data
        );

        addAssistantMessage(
            "The server returned an invalid response."
        );

        finishResponse();

        return;
    }

    console.log(
        "RECEIVED ← WebSocket:",
        data
    );


    /* STATUS */

    if (
        data.type === "status"
    ) {

        updateSearchingMessage(
            data.message ||
            "Thinking..."
        );

        setChatStatus(
            true,
            data.message ||
            "Processing..."
        );

        return;
    }


    /* TOKEN / CHUNK */

    if (
        data.type === "token" ||
        data.type === "chunk"
    ) {

        handleStreamingToken(
            data.content ||
            data.token ||
            ""
        );

        return;
    }


    /* ERROR */

    if (
        data.type === "error"
    ) {

        removeSearchingMessage();

        const message =
            data.message ||
            data.error ||
            "The server could not process your request.";

        addAssistantMessage(
            formatServerError(
                message
            )
        );

        finishResponse();

        setChatStatus(
            true,
            "Chat connected"
        );

        return;
    }


    /* DONE */

    if (
        data.type === "done"
    ) {

        removeSearchingMessage();

        const answer =
            extractResponseText(
                data
            );

        const sources =
            extractSources(
                data
            );

        if (
            currentAssistantMessage
        ) {

            updateAssistantMessageElement(
                currentAssistantMessage,
                answer
            );

            const wrapper =
                currentAssistantMessage.parentElement;

            addSources(
                wrapper,
                sources
            );

            addResponseActions(
                wrapper,
                answer
            );

            currentAssistantMessage =
                null;

        } else {

            addAssistantMessage(
                answer ||
                "I could not generate an answer from the uploaded documents.",
                sources
            );
        }

        chatHistory.push({
            role: "assistant",
            content: answer,
            mode:
                data.mode ||
                currentMode
        });

        finishResponse();

        setChatStatus(
            true,
            "Chat connected"
        );

        return;
    }


    /* GENERIC RESPONSE */

    const answer =
        extractResponseText(
            data
        );

    if (answer) {

        removeSearchingMessage();

        addAssistantMessage(
            answer,
            extractSources(data)
        );

        chatHistory.push({
            role: "assistant",
            content: answer,
            mode:
                data.mode ||
                currentMode
        });
    }

    finishResponse();
}


/* STREAMING TOKEN */

function handleStreamingToken(
    token
) {

    if (!token) {
        return;
    }

    removeSearchingMessage();

    if (!currentAssistantMessage) {

        currentAssistantMessage =
            createAssistantMessageElement();

        chatMessages.appendChild(
            currentAssistantMessage.parentElement
        );
    }

    const existing =
        currentAssistantMessage.dataset.text ||
        "";

    const updated =
        existing +
        String(token);

    currentAssistantMessage.dataset.text =
        updated;

    updateAssistantMessageElement(
        currentAssistantMessage,
        updated
    );
}


/* RESPONSE TEXT */

function extractResponseText(
    data
) {

    if (!data) {
        return "";
    }

    if (
        typeof data === "string"
    ) {

        return data;
    }

    return String(
        data.answer ||
        data.response ||
        data.content ||
        data.message ||
        ""
    ).trim();
}


/* SOURCES */

function extractSources(
    data
) {

    if (!data) {
        return [];
    }

    if (
        Array.isArray(data.sources)
    ) {

        return data.sources;
    }

    if (
        Array.isArray(data.documents)
    ) {

        return data.documents;
    }

    if (
        Array.isArray(data.retrieved_documents)
    ) {

        return data.retrieved_documents;
    }

    return [];
}


/* SEARCHING / TYPING */

function showSearchingMessage(
    message = "Thinking..."
) {

    removeSearchingMessage();

    if (!chatMessages) {
        return;
    }

    hideEmptyChat();

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "searchingMessage";

    wrapper.className =
        "message assistant";

    wrapper.innerHTML = `
        <div class="bubble">

            <div class="typing-row">

                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>

                <span class="typing-text">
                    ${escapeHtml(message)}
                </span>

            </div>

        </div>
    `;

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();
}


function updateSearchingMessage(
    message
) {

    const searching =
        $("searchingMessage");

    if (!searching) {

        showSearchingMessage(
            message
        );

        return;
    }

    const text =
        searching.querySelector(
            ".typing-text"
        );

    if (text) {

        text.textContent =
            message;
    }

    scrollChatToBottom();
}


function removeSearchingMessage() {

    const searching =
        $("searchingMessage");

    if (searching) {

        searching.remove();
    }
}


/* USER MESSAGE */

function addUserMessage(
    text,
    mode
) {

    if (!chatMessages) {
        return;
    }

    hideEmptyChat();

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message user";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    const label =
        document.createElement(
            "div"
        );

    label.className =
        "message-label";

    label.textContent =
        mode === "sales"
            ? "Sales"
            : "AI Tutor";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble";

    bubble.textContent =
        text;

    content.appendChild(
        label
    );

    content.appendChild(
        bubble
    );

    wrapper.appendChild(
        content
    );

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();
}


/* ASSISTANT MESSAGE */

function addAssistantMessage(
    text,
    sources = []
) {

    if (!chatMessages) {
        return;
    }

    hideEmptyChat();

    const bubble =
        createAssistantMessageElement();

    updateAssistantMessageElement(
        bubble,
        text
    );

    const wrapper =
        bubble.parentElement;

    addSources(
        wrapper,
        sources
    );

    addResponseActions(
        wrapper,
        text
    );

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();

    currentAssistantMessage =
        null;
}


/*  CREATE ASSISTANT MESSAGE */

function createAssistantMessageElement() {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message assistant";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    const label =
        document.createElement(
            "div"
        );

    label.className =
        "message-label";

    label.textContent =
        "RAG Assistant";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble";

    content.appendChild(
        label
    );

    content.appendChild(
        bubble
    );

    wrapper.appendChild(
        content
    );

    return bubble;
}


/* UPDATE ASSISTANT MESSAGE */

function updateAssistantMessageElement(
    bubble,
    text
) {

    if (!bubble) {
        return;
    }

    bubble.dataset.text =
        String(text || "");

    bubble.innerHTML =
        renderAssistantMarkdown(
            text
        );

    scrollChatToBottom();
}


/* MARKDOWN */

function renderAssistantMarkdown(
    text
) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";
    }

    const safeText =
        String(text);

    if (
        typeof marked !== "undefined" &&
        typeof DOMPurify !== "undefined"
    ) {

        try {

            const html =
                marked.parse(
                    safeText,
                    {
                        gfm: true,
                        breaks: true
                    }
                );

            return DOMPurify.sanitize(
                html
            );

        } catch (error) {

            console.error(
                "Markdown rendering error:",
                error
            );
        }
    }

    return escapeHtml(
        safeText
    ).replace(
        /\n/g,
        "<br>"
    );
}


/* SOURCES */

function addSources(
    messageElement,
    sources
) {

    if (
        !messageElement ||
        !Array.isArray(sources) ||
        sources.length === 0
    ) {

        return;
    }

    const content =
        messageElement.querySelector(
            ".message-content"
        ) || messageElement;

    const oldSources =
        content.querySelector(
            ".sources"
        );

    if (oldSources) {

        oldSources.remove();
    }

    const container =
        document.createElement(
            "div"
        );

    container.className =
        "sources";

    sources.forEach(
        source => {

            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "source-chip";

            chip.textContent =
                formatSource(
                    source
                );

            container.appendChild(
                chip
            );
        }
    );

    const actions =
        content.querySelector(
            ".response-actions"
        );

    if (actions) {

        content.insertBefore(
            container,
            actions
        );

    } else {

        content.appendChild(
            container
        );
    }
}


/* SOURCE FORMAT */

function formatSource(
    source
) {

    if (!source) {
        return "Source";
    }

    if (
        typeof source === "string"
    ) {

        return source;
    }

    const metadata =
        source.metadata ||
        source;

    const filename =
        metadata.source ||
        metadata.filename ||
        metadata.file_name ||
        metadata.name ||
        "Document";

    const page =
        metadata.page;

    if (
        page !== undefined &&
        page !== null &&
        page !== ""
    ) {

        return `${filename} • Page ${page}`;
    }

    return filename;
}


/* RESPONSE ACTIONS */

function addResponseActions(
    messageElement,
    answer
) {

    if (
        !messageElement ||
        !answer
    ) {

        return;
    }

    const content =
        messageElement.querySelector(
            ".message-content"
        ) || messageElement;

    const oldActions =
        content.querySelector(
            ".response-actions"
        );

    if (oldActions) {

        oldActions.remove();
    }

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "response-actions";


    /* READ ALOUD BUTTON */

    const readButton =
        document.createElement(
            "button"
        );

    readButton.type =
        "button";

    readButton.className =
        "response-action";

    readButton.title =
        "Read aloud";

    readButton.setAttribute(
        "aria-label",
        "Read aloud"
    );

    readButton.innerHTML =
        readAloudIcon();

    readButton.addEventListener(
        "click",
        () => {

            readAssistantResponse(
                answer,
                readButton
            );
        }
    );


    /* COPY BUTTON */

    const copyButton =
        document.createElement(
            "button"
        );

    copyButton.type =
        "button";

    copyButton.className =
        "response-action";

    copyButton.title =
        "Copy";

    copyButton.setAttribute(
        "aria-label",
        "Copy response"
    );

    copyButton.innerHTML =
        copyIcon();

    copyButton.addEventListener(
        "click",
        async () => {

            await copyAssistantResponse(
                answer,
                copyButton
            );
        }
    );


    actions.appendChild(
        readButton
    );

    actions.appendChild(
        copyButton
    );

    content.appendChild(
        actions
    );
}


/* RESPONSE ICONS */

function readAloudIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
        >
            <path
                d="M4 9v6h4l5 4V5L8 9H4Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
            />

            <path
                d="M16 9.5c1.2 1.4 1.2 3.6 0 5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M18.5 7c2.5 2.8 2.5 7.2 0 10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
    `;
}


function stopIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
        >
            <rect
                x="7"
                y="7"
                width="10"
                height="10"
                rx="1.5"
                fill="currentColor"
            />
        </svg>
    `;
}


function copyIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
        >
            <rect
                x="8"
                y="8"
                width="11"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4H6.5
                   A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0
                   6.5 16H8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
    `;
}


function checkIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
        >
            <path
                d="m5 12 4 4L19 6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `;
}


/* READ ALOUD */

function readAssistantResponse(
    text,
    button
) {

    if (
        typeof window.speechSynthesis ===
        "undefined"
    ) {

        alert(
            "Read aloud is not supported in this browser."
        );

        return;
    }

    if (
        window.speechSynthesis.speaking
    ) {

        window.speechSynthesis.cancel();

        if (button) {

            button.innerHTML =
                readAloudIcon();

            button.title =
                "Read aloud";

            button.setAttribute(
                "aria-label",
                "Read aloud"
            );
        }

        return;
    }

    const plainText =
        markdownToPlainText(
            text
        );

    if (!plainText) {
        return;
    }

    const utterance =
        new SpeechSynthesisUtterance(
            plainText
        );

    utterance.lang =
        "en-IN";

    utterance.rate =
        0.95;

    utterance.pitch =
        1;

    utterance.onstart =
        () => {

            if (button) {

                button.innerHTML =
                    stopIcon();

                button.title =
                    "Stop";

                button.setAttribute(
                    "aria-label",
                    "Stop reading"
                );
            }
        };

    utterance.onend =
        () => {

            if (button) {

                button.innerHTML =
                    readAloudIcon();

                button.title =
                    "Read aloud";

                button.setAttribute(
                    "aria-label",
                    "Read aloud"
                );
            }
        };

    utterance.onerror =
        () => {

            if (button) {

                button.innerHTML =
                    readAloudIcon();

                button.title =
                    "Read aloud";

                button.setAttribute(
                    "aria-label",
                    "Read aloud"
                );
            }
        };

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        utterance
    );
}


/* MARKDOWN TO PLAIN TEXT */

function markdownToPlainText(
    markdown
) {

    if (!markdown) {
        return "";
    }

    const html =
        renderAssistantMarkdown(
            markdown
        );

    const temp =
        document.createElement(
            "div"
        );

    temp.innerHTML =
        html;

    return (
        temp.textContent ||
        temp.innerText ||
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


/* COPY */

async function copyAssistantResponse(
    text,
    button
) {

    const plainText =
        markdownToPlainText(
            text
        );

    if (!plainText) {
        return;
    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                plainText
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                plainText;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            textarea.style.top =
                "0";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            const copied =
                document.execCommand(
                    "copy"
                );

            textarea.remove();

            if (!copied) {

                throw new Error(
                    "Copy command failed."
                );
            }
        }

        if (button) {

            button.innerHTML =
                checkIcon();

            button.title =
                "Copied";

            button.setAttribute(
                "aria-label",
                "Copied"
            );

            setTimeout(
                () => {

                    button.innerHTML =
                        copyIcon();

                    button.title =
                        "Copy";

                    button.setAttribute(
                        "aria-label",
                        "Copy response"
                    );

                },
                1500
            );
        }

    } catch (error) {

        console.error(
            "COPY ERROR:",
            error
        );

        if (button) {

            button.innerHTML =
                copyIcon();

            button.title =
                "Copy failed";

            button.setAttribute(
                "aria-label",
                "Copy failed"
            );
        }
    }
}


/* MODE CHANGE MESSAGE */

function addModeChangeMessage(
    mode
) {

    if (!chatMessages) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message assistant";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble";

    bubble.textContent =
        mode === "sales"
            ? "Switched to Sales mode."
            : "Switched to AI Tutor mode.";

    content.appendChild(
        bubble
    );

    wrapper.appendChild(
        content
    );

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();
}


/* EMPTY CHAT */

function hideEmptyChat() {

    if (emptyChat) {

        emptyChat.style.display =
            "none";
    }
}


/* FINISH RESPONSE */

function finishResponse() {

    isSending =
        false;

    updateSendButton();

    currentAssistantMessage =
        null;
}


/* FRIENDLY SERVER ERROR */

function formatServerError(
    message
) {

    const text =
        String(message || "");

    if (
        text.includes("429") ||
        text.includes("RESOURCE_EXHAUSTED") ||
        text.toLowerCase().includes("quota")
    ) {

        return (
            "The Gemini API quota has been reached. " +
            "Please wait and try again, or use another available Gemini model."
        );
    }

    if (
        text.includes("503") ||
        text.includes("UNAVAILABLE")
    ) {

        return (
            "The Gemini AI service is temporarily unavailable. " +
            "Please try again in a few seconds."
        );
    }

    if (
        text.includes("404") ||
        text.includes("NOT_FOUND")
    ) {

        return (
            "The configured Gemini model is not available. " +
            "Please check GEMINI_MODEL in your .env file."
        );
    }

    return text;
}


/* FRIENDLY ERROR */

function getFriendlyErrorMessage(
    error,
    fallback
) {

    if (!error) {
        return fallback;
    }

    const message =
        String(
            error.message ||
            error
        );

    if (
        message.includes("Failed to fetch")
    ) {

        return (
            "Could not connect to the server. " +
            "Make sure FastAPI/Uvicorn is running."
        );
    }

    if (
        message.includes("429") ||
        message.toLowerCase().includes("quota")
    ) {

        return (
            "Gemini API quota has been reached. " +
            "Please wait and try again."
        );
    }

    if (
        message.includes("503") ||
        message.includes("UNAVAILABLE")
    ) {

        return (
            "Gemini is temporarily unavailable. " +
            "Please try again."
        );
    }

    return message || fallback;
}


/* SAFE JSON */

async function parseJSONSafe(
    response
) {

    try {

        return await response.json();

    } catch {

        return null;
    }
}


/* SCROLL */

function scrollChatToBottom() {

    if (!chatMessages) {
        return;
    }

    requestAnimationFrame(
        () => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        }
    );
}


function scrollChat() {

    scrollChatToBottom();
}


/* ESCAPE HTML */

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* GLOBAL EXPORTS */

window.setMode =
    setMode;

window.toggleModeMenu =
    toggleModeMenu;

window.handleFileSelect =
    handleFileSelect;

window.uploadPDF =
    uploadPDF;

window.loadDocuments =
    loadDocuments;

window.handleKey =
    handleKey;

window.sendMessage =
    sendMessage;


/* DEBUG OBJECT */

window.RAG_DEBUG = {

    getMode: () =>
        currentMode,

    getSocketState: () =>
        socket
            ? socket.readyState
            : null,

    getSocketConnected: () =>
        socketConnected,

    getDocumentId: () =>
        currentDocumentId,

    getDocuments: () =>
        uploadedDocuments,

    getChatHistory: () =>
        chatHistory,

    getSendingState: () =>
        isSending,

    getChatUnlocked: () =>
        hasUploadedDocument,

    reconnect: () =>
        connectWebSocket(),

    reloadDocuments: () =>
        loadDocuments(),

    clearChat: () => {

        if (chatMessages) {

            chatMessages.innerHTML =
                "";

            if (emptyChat) {

                emptyChat.style.display =
                    "";
            }
        }

        chatHistory =
            [];

        currentAssistantMessage =
            null;
    }

};


/* FINAL LOG */

console.log(
    "Multi-Mode RAG Assistant frontend loaded successfully."
);

console.log(
    "Debug: window.RAG_DEBUG is available."
);