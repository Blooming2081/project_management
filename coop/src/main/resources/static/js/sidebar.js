/*변수 선언*/
const middle = document.getElementById("middleSidebar");
const closeToggle = document.getElementById("closeToggle");
const resizer = document.getElementById("resizer");
const left = document.getElementById("leftSidebar");

let isResizing = false;
let isFloatingLocked = false;



// --- 리사이징 시작 ---
resizer.addEventListener("mousedown", () => {
	isResizing = true;
	isFloatingLocked = true;
	document.body.style.cursor = "ew-resize";
});
document.addEventListener("mouseup", () => {
	isResizing = false;
	isFloatingLocked = false;
	document.body.style.cursor = "";
});
document.addEventListener("mousemove", (e) => {
	if (isResizing) {
		const newWidth = e.clientX - left.offsetWidth;
		middle.style.width = `${Math.max(180, newWidth)}px`;
		return;
	}

	// 리사이징중 마우스 하이라이트 방지
	document.addEventListener('mousedown', () => {
		document.body.style.userSelect = 'none';
	});
	document.addEventListener('mouseup', () => {
		document.body.style.userSelect = 'auto';
	});
	/*// 플로팅 자동 열기/닫기
	const nearLeft = e.clientX >= left.offsetWidth + 6 && e.clientX <= left.offsetWidth + 10;
	const hoverLeft = left.matches(":hover");

	if (middle.classList.contains("hidden") && nearLeft && !hoverLeft) {
		middle.classList.add("floating");
	} else if (
		middle.classList.contains("floating") &&
		(hoverLeft || !middle.matches(":hover"))
	) {
		setTimeout(() => {
			if (hoverLeft || (!left.matches(":hover") && !middle.matches(":hover"))) {
				middle.classList.remove("floating");
			}
		}, 300);
	}*/
});

// --- 중간 사이드바 토글 버튼 보이기/숨기기 ---
middle.addEventListener("mouseenter", () => {
	if (!middle.classList.contains("hidden")) {
		closeToggle.style.visibility = "visible";
	}
});
middle.addEventListener("mouseleave", () => {
	closeToggle.style.visibility = "hidden";
});

// --- 사이드바 숨기기 버튼 ---  
closeToggle.addEventListener("click", () => {
	middle.classList.add("hidden");
	middle.classList.remove("floating");
});


/* 프로젝트 관리 사이드바 스크립트 */

// sidebar.js
(() => {
	document.addEventListener('DOMContentLoaded', initSidebar);

	function initSidebar() {
		const addBtn = document.getElementById('addProjectBtn');
		const projectList = document.getElementById('project-list');
		const template = document.getElementById('project-item-template');
		const addModalEl = document.getElementById('addProjectModal');
		const addModal = new bootstrap.Modal(addModalEl);
		const nameInput = document.getElementById('projectNameInput');
		const confirmAddBtn = document.getElementById('confirmAddProjectBtn');

		// 1) 초기 로드: DB에서 프로젝트 목록 가져오기
		fetch('/projects/list')
			.then(res => res.json())
			.then(data => data.forEach(p => appendProject(p)))
			.catch(console.error);

		// 2) “프로젝트 추가” 버튼 → 모달 열기
		addBtn.addEventListener('click', () => {
			nameInput.value = '';
			nameInput.classList.remove('is-invalid');
			addModal.show();
		});

		// 3) 모달 “추가” 클릭 → API 호출
		confirmAddBtn.addEventListener('click', () => {
			const name = nameInput.value.trim();
			if (!name) {
				nameInput.classList.add('is-invalid');
				return;
			}
			addModal.hide();
			fetch('/projects/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectName: name })
			})
				.then(res => res.json())
				.then(newProj => appendProject(newProj))
				.catch(console.error);
		});



		// ─── 프로젝트 리스트 렌더링 ───────────────────────────────────────────
		function appendProject(proj) {
			const clone = template.content.cloneNode(true);
			const item = clone.querySelector('.accordion-item');
			const btn = clone.querySelector('.accordion-button');
			const collapse = clone.querySelector('.accordion-collapse');


			const headerId = `heading-${proj.projectId}`;
			const collapseId = `collapse-${proj.projectId}`;

			item.dataset.id = proj.projectId;
			btn.textContent = proj.projectName;
			btn.setAttribute('data-bs-target', `#${collapseId}`);
			btn.setAttribute('aria-controls', collapseId);

			collapse.id = collapseId;
			collapse.setAttribute('aria-labelledby', headerId);
			collapse.setAttribute('data-bs-parent', '#project-list');


			// ✅ 버튼 삽입
			const body = clone.querySelector('.accordion-body');
			const buttonGroup = document.createElement('div');
			buttonGroup.className = 'mt-2';

			// 버튼들 생성
			buttonGroup.innerHTML = `
			  <div class="card p-2 border-0 bg-light">
			    <div class="d-grid gap-2">
			      <a class="btn btn-outline-primary btn-sm" href="/gantt?projectId=${proj.projectId}">Gantt</a>
			      <a class="btn btn-outline-primary btn-sm" href="/mindmap?projectId=${proj.projectId}">Mindmap</a>
			      <a class="btn btn-outline-primary btn-sm" href="/admin?projectId=${proj.projectId}">Admin</a>
			      <a class="btn btn-outline-primary btn-sm" href="/chat?projectId=${proj.projectId}">Chat</a>
			    </div>
			  </div>
			`;


			body.appendChild(buttonGroup);

			projectList.appendChild(item);
		}
		// ────────────────────────────────────────────────────────────────────
	}
})();