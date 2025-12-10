/* ================================================================= */
/* 공통: 숫자 천단위 콤마 */
/* ================================================================= */
function addComma(v) {
    v = v.replace(/[^0-9]/g, "");
    return v ? Number(v).toLocaleString() : "";
}

function removeComma(v) {
    return Number(v.replace(/,/g, "")) || 0;
}

/* ================================================================= */
/* 탭 전환 */
/* ================================================================= */
const tabButtons = document.querySelectorAll(".tab-button");
const pages = document.querySelectorAll(".page");

tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;

        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        pages.forEach((p) => p.classList.toggle("active", p.id === target));
    });
});

/* ================================================================= */
/* 자재 데이터 로딩 */
/* ================================================================= */
let materials = JSON.parse(localStorage.getItem("materials") || "[]");
let editingMaterialId = null; // ★ 자재 식별용 ID 저장

function saveMaterials() {
    localStorage.setItem("materials", JSON.stringify(materials));
}

/* ================================================================= */
/* 자재 입력: 단위 행 생성 */
/* ================================================================= */
const unitBody = document.getElementById("unit-table-body");

function createUnitRow() {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><input type="text" class="unit-name" /></td>
        <td><input type="text" class="unit-material-price price-input" /></td>
        <td><input type="text" class="unit-delivery-price price-input" /></td>
        <td><input type="text" class="unit-total-purchase" readonly /></td>
        <td><input type="text" class="unit-sell-ex price-input" /></td>
        <td><input type="text" class="unit-sell-in price-input" /></td>
        <td><button class="sub-button unit-delete">X</button></td>
    `;

    const mat = tr.querySelector(".unit-material-price");
    const del = tr.querySelector(".unit-delivery-price");
    const tot = tr.querySelector(".unit-total-purchase");

    tr.querySelectorAll(".price-input").forEach((input) => {
        input.addEventListener("input", () => {
            input.value = addComma(input.value);
            tot.value = addComma(String(removeComma(mat.value) + removeComma(del.value)));
        });
    });

    tr.querySelector(".unit-delete").addEventListener("click", () => tr.remove());

    return tr;
}

/* 초기 단위 1행 추가 */
unitBody.appendChild(createUnitRow());

/* + 단위 추가 */
document.getElementById("add-unit-row").addEventListener("click", () => {
    unitBody.appendChild(createUnitRow());
});

/* - 단위 삭제 */
document.getElementById("remove-unit-row").addEventListener("click", () => {
    const rows = unitBody.querySelectorAll("tr");
    if (rows.length <= 1) {
        alert("단위는 최소 1개 이상 필요합니다.");
        return;
    }
    rows[rows.length - 1].remove();
});

/* ================================================================= */
/* 자재 입력 초기화 기능 */
/* ================================================================= */
function resetMaterialInput() {
    editingMaterialId = null; // 새 입력 모드로 전환
    document.getElementById("material-name").value = "";

    unitBody.innerHTML = "";
    unitBody.appendChild(createUnitRow());
    document.getElementById("material-name").focus();
}

document.getElementById("reset-material-input").addEventListener("click", resetMaterialInput);

/* ================================================================= */
/* 자재 저장 */
/* ================================================================= */
document.getElementById("save-material").addEventListener("click", () => {
    const name = document.getElementById("material-name").value.trim();
    if (!name) {
        alert("자재 명칭을 입력해주세요.");
        return;
    }

    const rows = unitBody.querySelectorAll("tr");
    const units = [];

    rows.forEach((row) => {
        const unitName = row.querySelector(".unit-name").value.trim();
        if (!unitName) return;

        const material = removeComma(row.querySelector(".unit-material-price").value);
        const delivery = removeComma(row.querySelector(".unit-delivery-price").value);

        units.push({
            unitName,
            materialPrice: material,
            deliveryPrice: delivery,
            purchase: material + delivery,
            sellEx: removeComma(row.querySelector(".unit-sell-ex").value),
            sellIn: removeComma(row.querySelector(".unit-sell-in").value),
        });
    });

    if (!units.length) {
        alert("단위는 최소 1개 이상 입력해야 합니다.");
        return;
    }

    /* 🌟 ID 기반 저장 로직 */
    if (editingMaterialId) {
        const idx = materials.findIndex(m => m.id === editingMaterialId);
        if (idx >= 0) {
            materials[idx].name = name;
            materials[idx].units = units;
        }
    } else {
        materials.push({
            id: Date.now(),
            name,
            units
        });
    }

    saveMaterials();
    renderMaterialList();
    renderInputMaterialList();

    alert("저장되었습니다.");

    resetMaterialInput();
});

/* ================================================================= */
/* 입력 탭 — 자재 목록 표시 */
/* ================================================================= */
const inputListBody = document.getElementById("material-input-list-body");

function renderInputMaterialList(keyword = "") {
    inputListBody.innerHTML = "";

    materials.forEach((m) => {
        m.units.forEach((u) => {
            const match =
                !keyword ||
                m.name.includes(keyword) ||
                u.unitName.includes(keyword);

            if (!match) return;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="clickable">${m.name}</td>
                <td>${u.unitName}</td>
                <td>${u.materialPrice.toLocaleString()}</td>
                <td>${u.deliveryPrice.toLocaleString()}</td>
                <td>${u.purchase.toLocaleString()}</td>
                <td>${u.sellEx?.toLocaleString() || "-"}</td>
                <td>${u.sellIn?.toLocaleString() || "-"}</td>
                <td><button class="material-delete-btn" data-id="${m.id}">삭제</button></td>
            `;

            /* 📌 명칭 클릭 → 불러오기 */
            tr.children[0].addEventListener("click", () => loadMaterialToInput(m.id));

            /* 📌 자재 삭제 버튼 */
            tr.querySelector(".material-delete-btn").addEventListener("click", () => {
                materials = materials.filter(mat => mat.id !== m.id);
                saveMaterials();
                renderInputMaterialList();
                renderMaterialList();
            });

            inputListBody.appendChild(tr);
        });
    });
}

renderInputMaterialList();

/* 검색 기능 */
document.getElementById("material-search").addEventListener("input", (e) => {
    const keyword = e.target.value.trim();
    renderInputMaterialList(keyword.length < 2 ? "" : keyword);
});

/* ================================================================= */
/* 명칭 클릭 → 자재 입력창 자동 로드 */
/* ================================================================= */
function loadMaterialToInput(materialId) {
    const target = materials.find((m) => m.id === materialId);
    if (!target) return;

    editingMaterialId = target.id;

    document.getElementById("material-name").value = target.name;

    /* 기존 단위 행 비우고 채우기 */
    unitBody.innerHTML = "";

    target.units.forEach((u) => {
        const tr = createUnitRow();

        tr.querySelector(".unit-name").value = u.unitName;
        tr.querySelector(".unit-material-price").value = u.materialPrice.toLocaleString();
        tr.querySelector(".unit-delivery-price").value = u.deliveryPrice.toLocaleString();
        tr.querySelector(".unit-total-purchase").value = u.purchase.toLocaleString();
        tr.querySelector(".unit-sell-ex").value = u.sellEx?.toLocaleString() || "";
        tr.querySelector(".unit-sell-in").value = u.sellIn?.toLocaleString() || "";

        unitBody.appendChild(tr);
    });

    document.getElementById("material-name").focus();
}

/* ================================================================= */
/* 자재 목록 탭 — 렌더링 */
/* ================================================================= */
const materialListBody = document.getElementById("material-list-body");

function renderMaterialList() {
    materialListBody.innerHTML = "";

    materials.forEach((m) => {
        m.units.forEach((u) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><input type="checkbox" class="mat-check" /></td>
                <td>${m.name}</td>
                <td>${u.unitName}</td>
                <td>${u.sellEx?.toLocaleString() || "-"}</td>
                <td>${u.sellIn?.toLocaleString() || "-"}</td>
                <td><input type="text" class="mat-qty" /></td>
           `;

            const qtyInput = tr.querySelector(".mat-qty");
            const checkbox = tr.querySelector(".mat-check");

            qtyInput.addEventListener("input", (e) => {
                e.target.value = addComma(e.target.value);
                checkbox.checked = removeComma(e.target.value) > 0;
            });

            materialListBody.appendChild(tr);
        });
    });
}

renderMaterialList();

/* ================================================================= */
/* 선택 계산 */
/* ================================================================= */
document.getElementById("calc-selected").addEventListener("click", () => {
    let total = 0;

    materialListBody.querySelectorAll("tr").forEach((row) => {
        const checkbox = row.querySelector(".mat-check");
        if (!checkbox || !checkbox.checked) return;

        const qty = removeComma(row.querySelector(".mat-qty").value) || 0;

        const sellIn = row.children[4].textContent.replace(/,/g, "");
        const sellEx = row.children[3].textContent.replace(/,/g, "");

        const price = Number(sellIn) || Number(sellEx) || 0;

        total += price * qty;
    });

    document.getElementById("selected-total").textContent = total.toLocaleString();
});

/* ================================================================= */
/* 초기화 버튼 */
/* ================================================================= */
document.getElementById("reset-selected").addEventListener("click", () => {
    materialListBody.querySelectorAll("tr").forEach((row) => {
        const checkbox = row.querySelector(".mat-check");
        const qtyInput = row.querySelector(".mat-qty");
        if (checkbox) checkbox.checked = false;
        if (qtyInput) qtyInput.value = "";
    });
    document.getElementById("selected-total").textContent = "0";
});

/* ================================================================= */
/* 임시 견적 */
/* ================================================================= */
document.getElementById("calc-estimate").addEventListener("click", () => {
    const name = document.getElementById("estimate-name").value.trim();
    const date = document.getElementById("estimate-date").value;
    const phone = document.getElementById("estimate-phone").value.trim();
    const summary = document.getElementById("estimate-summary").value.trim();

    let out = "";
    out += `견적 이름: ${name || "(입력 없음)"}\n`;
    out += `견적 일자: ${date || "(입력 없음)"}\n`;
    out += `전화번호: ${phone || "(입력 없음)"}\n\n`;
    out += `공사 개략 내용:\n${summary || "(입력 없음)"}`;

    document.getElementById("estimate-result").textContent = out;
});
