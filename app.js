"use strict";

console.log("TroubleVault CRUD engine boot OK");


/* =========================
   DOM ELEMENTS
========================= */

const matrixCanvas =
    document.querySelector("#matrixCanvas");

const motionToggleButton =
    document.querySelector("#motionToggleButton");

const sampleRecordButton =
    document.querySelector("#sampleRecordButton");

const resetFormButton =
    document.querySelector("#resetFormButton");

const storageTestButton =
    document.querySelector("#storageTestButton");

const recordForm =
    document.querySelector("#recordForm");

const previewStatus =
    document.querySelector("#previewStatus");

const storageStatus =
    document.querySelector("#storageStatus");

const searchInput =
    document.querySelector("#searchInput");

const filterCategory =
    document.querySelector("#filterCategory");

const recordList =
    document.querySelector("#recordList");

const titleInput =
    document.querySelector("#titleInput");

const categoryInput =
    document.querySelector("#categoryInput");

const tagsInput =
    document.querySelector("#tagsInput");

const problemInput =
    document.querySelector("#problemInput");

const causeInput =
    document.querySelector("#causeInput");

const solutionInput =
    document.querySelector("#solutionInput");

const resultInput =
    document.querySelector("#resultInput");

const submitButton =
    recordForm.querySelector(
        'button[type="submit"]'
    );


/* =========================
   STORAGE
========================= */

const STORAGE_KEY =
    "troublevault-records-v1";

let records =
    loadRecords();


/* =========================
   EDIT STATE
========================= */

let editingRecordId =
    null;


/* =========================
   MATRIX SETTINGS
========================= */

const matrixContext =
    matrixCanvas.getContext("2d");

const matrixCharacters =
    "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-<>";

const matrixFontSize =
    16;

let matrixAnimationEnabled =
    true;

let matrixAnimationFrameId =
    null;

let matrixColumns =
    0;

let matrixDrops =
    [];


/* =========================
   MATRIX
========================= */

function resizeMatrixCanvas() {

    matrixCanvas.width =
        window.innerWidth;

    matrixCanvas.height =
        window.innerHeight;


    matrixColumns =
        Math.max(
            1,
            Math.floor(
                matrixCanvas.width /
                matrixFontSize
            )
        );


    matrixDrops =
        Array(
            matrixColumns
        ).fill(0);

}


function drawMatrixRain() {

    if (!matrixAnimationEnabled) {
        return;
    }


    matrixContext.fillStyle =
        "rgba(5, 6, 10, 0.12)";


    matrixContext.fillRect(
        0,
        0,
        matrixCanvas.width,
        matrixCanvas.height
    );


    matrixContext.fillStyle =
        "#7cffb2";


    matrixContext.font =
        `${matrixFontSize}px monospace`;


    for (
        let index = 0;
        index < matrixDrops.length;
        index += 1
    ) {

        const text =
            matrixCharacters.charAt(
                Math.floor(
                    Math.random() *
                    matrixCharacters.length
                )
            );


        const x =
            index *
            matrixFontSize;


        const y =
            matrixDrops[index] *
            matrixFontSize;


        matrixContext.fillText(
            text,
            x,
            y
        );


        if (
            y > matrixCanvas.height &&
            Math.random() > 0.975
        ) {

            matrixDrops[index] =
                0;

        }


        matrixDrops[index] += 1;

    }


    matrixAnimationFrameId =
        window.requestAnimationFrame(
            drawMatrixRain
        );

}


function startMatrixRain() {

    const reduceMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (reduceMotion) {

        matrixAnimationEnabled =
            false;


        motionToggleButton.textContent =
            "Matrix Off";


        motionToggleButton.setAttribute(
            "aria-pressed",
            "true"
        );


        return;

    }


    if (
        matrixAnimationFrameId !== null
    ) {

        return;

    }


    matrixAnimationEnabled =
        true;


    resizeMatrixCanvas();


    drawMatrixRain();

}


function stopMatrixRain() {

    matrixAnimationEnabled =
        false;


    if (
        matrixAnimationFrameId !== null
    ) {

        window.cancelAnimationFrame(
            matrixAnimationFrameId
        );


        matrixAnimationFrameId =
            null;

    }


    matrixContext.clearRect(
        0,
        0,
        matrixCanvas.width,
        matrixCanvas.height
    );

}


window.addEventListener(
    "resize",
    function () {

        resizeMatrixCanvas();

    }
);


startMatrixRain();


/* =========================
   MATRIX TOGGLE
========================= */

motionToggleButton.addEventListener(
    "click",
    function () {

        if (matrixAnimationEnabled) {

            stopMatrixRain();


            motionToggleButton.textContent =
                "Matrix Off";


            motionToggleButton.setAttribute(
                "aria-pressed",
                "true"
            );

        }

        else {

            motionToggleButton.textContent =
                "Matrix On";


            motionToggleButton.setAttribute(
                "aria-pressed",
                "false"
            );


            startMatrixRain();

        }

    }
);


/* =========================
   SAMPLE RECORD
========================= */

sampleRecordButton.addEventListener(
    "click",
    function () {

        titleInput.value =
            "Postfix 외부 연결 실패";


        categoryInput.value =
            "Linux";


        tagsInput.value =
            "postfix, smtp, linux";


        problemInput.value =
            "외부에서 SMTP 접속이 되지 않았습니다.";


        causeInput.value =
            "inet_interfaces 설정이 localhost로 되어 있었습니다.";


        solutionInput.value =
            "main.cf에서 inet_interfaces = all 로 변경하고 postfix를 재시작했습니다.";


        resultInput.value =
            "외부 SMTP 연결이 정상적으로 성공했습니다.";


        previewStatus.textContent =
            "샘플 기록을 입력했습니다.";


        previewStatus.classList.add(
            "success"
        );

    }
);


/* =========================
   RESET FORM
========================= */

resetFormButton.addEventListener(
    "click",
    function () {

        window.setTimeout(
            function () {

                exitEditMode();


                previewStatus.textContent =
                    "입력 폼을 초기화했습니다.";


                previewStatus.classList.remove(
                    "success"
                );

            },
            0
        );

    }
);


/* =========================
   CREATE / UPDATE
========================= */

recordForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const formData =
            getFormData();


        if (
            !isValidFormData(
                formData
            )
        ) {

            previewStatus.textContent =
                "제목, 문제, 원인, 해결 방법, 결과를 모두 입력해 주세요.";


            previewStatus.classList.remove(
                "success"
            );


            return;

        }


        if (
            editingRecordId === null
        ) {

            createRecord(
                formData
            );

        }

        else {

            updateRecord(
                editingRecordId,
                formData
            );

        }

    }
);


/* =========================
   FORM DATA
========================= */

function getFormData() {

    return {

        title:
            titleInput.value.trim(),

        category:
            categoryInput.value,

        tags:
            tagsInput.value.trim(),

        problem:
            problemInput.value.trim(),

        cause:
            causeInput.value.trim(),

        solution:
            solutionInput.value.trim(),

        result:
            resultInput.value.trim()

    };

}


function isValidFormData(
    formData
) {

    return (
        formData.title !== "" &&
        formData.problem !== "" &&
        formData.cause !== "" &&
        formData.solution !== "" &&
        formData.result !== ""
    );

}


/* =========================
   CREATE
========================= */

function createRecord(
    formData
) {

    const newRecord = {

        id:
            createRecordId(),

        ...formData,

        favorite:
            false,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            null

    };


    const nextRecords = [
        newRecord,
        ...records
    ];


    if (
        !saveRecords(
            nextRecords
        )
    ) {

        showSaveError();

        return;

    }


    records =
        nextRecords;


    resetFormAfterSave();


    previewStatus.textContent =
        `"${newRecord.title}" 기록을 저장했습니다.`;


    previewStatus.classList.add(
        "success"
    );

}


/* =========================
   EDIT START
========================= */

function startEditRecord(
    recordId
) {

    const record =
        records.find(
            function (item) {

                return (
                    item.id ===
                    recordId
                );

            }
        );


    if (!record) {

        previewStatus.textContent =
            "수정할 기록을 찾지 못했습니다.";


        previewStatus.classList.remove(
            "success"
        );


        return;

    }


    editingRecordId =
        record.id;


    titleInput.value =
        record.title;


    categoryInput.value =
        record.category;


    tagsInput.value =
        record.tags;


    problemInput.value =
        record.problem;


    causeInput.value =
        record.cause;


    solutionInput.value =
        record.solution;


    resultInput.value =
        record.result;


    submitButton.textContent =
        "수정 저장";


    previewStatus.textContent =
        `"${record.title}" 기록을 수정 중입니다.`;


    previewStatus.classList.add(
        "success"
    );


    titleInput.focus();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================
   UPDATE
========================= */

function updateRecord(
    recordId,
    formData
) {

    const existingRecord =
        records.find(
            function (record) {

                return (
                    record.id ===
                    recordId
                );

            }
        );


    if (!existingRecord) {

        previewStatus.textContent =
            "수정할 기록을 찾지 못했습니다.";


        previewStatus.classList.remove(
            "success"
        );


        exitEditMode();


        return;

    }


    const nextRecords =
        records.map(
            function (record) {

                if (
                    record.id !==
                    recordId
                ) {

                    return record;

                }


                return {

                    ...record,

                    ...formData,

                    updatedAt:
                        new Date()
                            .toISOString()

                };

            }
        );


    if (
        !saveRecords(
            nextRecords
        )
    ) {

        showSaveError();

        return;

    }


    records =
        nextRecords;


    const updatedTitle =
        formData.title;


    resetFormAfterSave();


    previewStatus.textContent =
        `"${updatedTitle}" 기록을 수정했습니다.`;


    previewStatus.classList.add(
        "success"
    );

}


/* =========================
   EXIT EDIT MODE
========================= */

function exitEditMode() {

    editingRecordId =
        null;


    submitButton.textContent =
        "기록 저장";

}


/* =========================
   DELETE
========================= */

function deleteRecord(
    recordId
) {

    const targetRecord =
        records.find(
            function (record) {

                return (
                    record.id ===
                    recordId
                );

            }
        );


    if (!targetRecord) {

        return;

    }


    const confirmed =
        window.confirm(
            `"${targetRecord.title}" 기록을 삭제할까요?`
        );


    if (!confirmed) {

        return;

    }


    const nextRecords =
        records.filter(
            function (record) {

                return (
                    record.id !==
                    recordId
                );

            }
        );


    if (
        !saveRecords(
            nextRecords
        )
    ) {

        showSaveError();

        return;

    }


    records =
        nextRecords;


    if (
        editingRecordId ===
        recordId
    ) {

        recordForm.reset();

        exitEditMode();

    }


    renderRecords();

    updateStorageStatus();


    previewStatus.textContent =
        `"${targetRecord.title}" 기록을 삭제했습니다.`;


    previewStatus.classList.add(
        "success"
    );

}


/* =========================
   FAVORITE
========================= */

function toggleFavorite(
    recordId
) {

    const nextRecords =
        records.map(
            function (record) {

                if (
                    record.id !==
                    recordId
                ) {

                    return record;

                }


                return {

                    ...record,

                    favorite:
                        !record.favorite

                };

            }
        );


    if (
        !saveRecords(
            nextRecords
        )
    ) {

        showSaveError();

        return;

    }


    records =
        nextRecords;


    renderRecords();


    const changedRecord =
        records.find(
            function (record) {

                return (
                    record.id ===
                    recordId
                );

            }
        );


    if (changedRecord) {

        previewStatus.textContent =
            changedRecord.favorite
                ? `"${changedRecord.title}" 기록을 즐겨찾기에 추가했습니다.`
                : `"${changedRecord.title}" 기록을 즐겨찾기에서 해제했습니다.`;


        previewStatus.classList.add(
            "success"
        );

    }

}


/* =========================
   SEARCH / FILTER
========================= */

searchInput.addEventListener(
    "input",
    function () {

        renderRecords();

    }
);


filterCategory.addEventListener(
    "change",
    function () {

        renderRecords();

    }
);


/* =========================
   STORAGE TEST
========================= */

storageTestButton.addEventListener(
    "click",
    function () {

        runStorageTest();

    }
);


function runStorageTest() {

    const testKey =
        "troublevault-storage-test";


    const testValue =
        "storage-ok";


    try {

        localStorage.setItem(
            testKey,
            testValue
        );


        const savedValue =
            localStorage.getItem(
                testKey
            );


        localStorage.removeItem(
            testKey
        );


        if (
            savedValue ===
            testValue
        ) {

            updateStorageStatus();


            console.log(
                "TroubleVault localStorage OK"
            );


            return;

        }


        throw new Error(
            "Stored value mismatch"
        );

    }

    catch (error) {

        storageStatus.textContent =
            "LocalStorage 테스트 실패 — 브라우저 저장 기능을 확인해 주세요.";


        storageStatus.classList.remove(
            "success"
        );


        console.error(
            "TroubleVault storage test failed:",
            error
        );

    }

}


/* =========================
   LOAD
========================= */

function loadRecords() {

    try {

        const savedData =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (
            savedData === null
        ) {

            return [];

        }


        const parsedData =
            JSON.parse(
                savedData
            );


        if (
            !Array.isArray(
                parsedData
            )
        ) {

            console.warn(
                "TroubleVault saved data is invalid."
            );


            return [];

        }


        return parsedData.map(
            function (record) {

                return {

                    ...record,

                    favorite:
                        Boolean(
                            record.favorite
                        )

                };

            }
        );

    }

    catch (error) {

        console.error(
            "TroubleVault load failed:",
            error
        );


        return [];

    }

}


/* =========================
   SAVE
========================= */

function saveRecords(
    recordData
) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                recordData
            )
        );


        return true;

    }

    catch (error) {

        console.error(
            "TroubleVault save failed:",
            error
        );


        return false;

    }

}


/* =========================
   ID
========================= */

function createRecordId() {

    return (
        Date.now()
            .toString(36)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );

}


/* =========================
   VISIBLE RECORDS
========================= */

function getVisibleRecords() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        filterCategory.value;


    return records
        .filter(
            function (record) {

                const matchesCategory =
                    selectedCategory ===
                        "ALL"
                    ||
                    record.category ===
                        selectedCategory;


                const searchableText = [
                    record.title,
                    record.category,
                    record.tags,
                    record.problem,
                    record.cause,
                    record.solution,
                    record.result
                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    searchTerm === ""
                    ||
                    searchableText.includes(
                        searchTerm
                    );


                return (
                    matchesCategory &&
                    matchesSearch
                );

            }
        )
        .sort(
            function (a, b) {

                if (
                    a.favorite !==
                    b.favorite
                ) {

                    return (
                        a.favorite
                            ? -1
                            : 1
                    );

                }


                return (
                    new Date(
                        b.createdAt
                    )
                    -
                    new Date(
                        a.createdAt
                    )
                );

            }
        );

}


/* =========================
   RENDER
========================= */

function renderRecords() {

    const visibleRecords =
        getVisibleRecords();


    recordList.replaceChildren();


    if (
        visibleRecords.length ===
        0
    ) {

        const emptyMessage =
            document.createElement(
                "p"
            );


        emptyMessage.className =
            "empty-records";


        emptyMessage.textContent =
            records.length === 0
                ? "아직 저장된 기록이 없습니다."
                : "검색 또는 필터 조건에 맞는 기록이 없습니다.";


        recordList.appendChild(
            emptyMessage
        );


        return;

    }


    visibleRecords.forEach(
        function (record) {

            recordList.appendChild(
                createRecordCard(
                    record
                )
            );

        }
    );

}


/* =========================
   CARD
========================= */

function createRecordCard(
    record
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "record-card";


    if (
        record.favorite
    ) {

        article.classList.add(
            "favorite-record"
        );

    }


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "record-card-header";


    const headingGroup =
        document.createElement(
            "div"
        );


    const heading =
        document.createElement(
            "h3"
        );


    if (
        record.favorite
    ) {

        const favoriteMark =
            document.createElement(
                "span"
            );


        favoriteMark.className =
            "favorite-mark";


        favoriteMark.textContent =
            "★";


        heading.appendChild(
            favoriteMark
        );

    }


    heading.appendChild(
        document.createTextNode(
            record.title
        )
    );


    const meta =
        document.createElement(
            "p"
        );


    meta.className =
        "record-meta";


    meta.textContent =
        record.tags
            ? `${record.category} · ${record.tags}`
            : record.category;


    const date =
        document.createElement(
            "span"
        );


    date.className =
        "record-date";


    date.textContent =
        getRecordDateText(
            record
        );


    headingGroup.append(
        heading,
        meta,
        date
    );


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "record-category";


    category.textContent =
        record.category;


    header.append(
        headingGroup,
        category
    );


    const detail =
        document.createElement(
            "dl"
        );


    detail.className =
        "record-detail";


    detail.append(
        createDetailRow(
            "Problem",
            record.problem
        ),
        createDetailRow(
            "Cause",
            record.cause
        ),
        createDetailRow(
            "Solution",
            record.solution
        ),
        createDetailRow(
            "Result",
            record.result
        )
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "record-actions";


    const favoriteButton =
        createActionButton(
            record.favorite
                ? "★ 즐겨찾기 해제"
                : "☆ 즐겨찾기",
            "favorite"
        );


    if (
        record.favorite
    ) {

        favoriteButton.classList.add(
            "favorite-active"
        );

    }


    favoriteButton.addEventListener(
        "click",
        function () {

            toggleFavorite(
                record.id
            );

        }
    );


    const editButton =
        createActionButton(
            "수정",
            "edit"
        );


    editButton.addEventListener(
        "click",
        function () {

            startEditRecord(
                record.id
            );

        }
    );


    const deleteButton =
        createActionButton(
            "삭제",
            "delete"
        );


    deleteButton.classList.add(
        "delete-button"
    );


    deleteButton.addEventListener(
        "click",
        function () {

            deleteRecord(
                record.id
            );

        }
    );


    actions.append(
        favoriteButton,
        editButton,
        deleteButton
    );


    article.append(
        header,
        detail,
        actions
    );


    return article;

}


/* =========================
   ACTION BUTTON
========================= */

function createActionButton(
    text,
    action
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "record-action-button";


    button.dataset.action =
        action;


    button.textContent =
        text;


    return button;

}


/* =========================
   DETAIL ROW
========================= */

function createDetailRow(
    label,
    value
) {

    const wrapper =
        document.createElement(
            "div"
        );


    const term =
        document.createElement(
            "dt"
        );


    term.textContent =
        label;


    const description =
        document.createElement(
            "dd"
        );


    description.textContent =
        value;


    wrapper.append(
        term,
        description
    );


    return wrapper;

}


/* =========================
   DATE
========================= */

function getRecordDateText(
    record
) {

    const createdText =
        formatRecordDate(
            record.createdAt
        );


    if (
        !record.updatedAt
    ) {

        return (
            `생성 ${createdText}`
        );

    }


    return (
        `수정 ${formatRecordDate(record.updatedAt)}`
    );

}


function formatRecordDate(
    dateValue
) {

    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "날짜 정보 없음";

    }


    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        date
    );

}


/* =========================
   RESET AFTER SAVE
========================= */

function resetFormAfterSave() {

    recordForm.reset();


    exitEditMode();


    searchInput.value =
        "";


    filterCategory.value =
        "ALL";


    renderRecords();


    updateStorageStatus();


    titleInput.focus();

}


/* =========================
   ERROR MESSAGE
========================= */

function showSaveError() {

    previewStatus.textContent =
        "브라우저 저장소에 기록을 저장하지 못했습니다.";


    previewStatus.classList.remove(
        "success"
    );

}


/* =========================
   STORAGE STATUS
========================= */

function updateStorageStatus() {

    const favoriteCount =
        records.filter(
            function (record) {

                return record.favorite;

            }
        ).length;


    storageStatus.textContent =
        `LocalStorage 준비 완료 · 전체 ${records.length}개 · 즐겨찾기 ${favoriteCount}개`;


    storageStatus.classList.add(
        "success"
    );

}


/* =========================
   INITIAL
========================= */

renderRecords();

updateStorageStatus();