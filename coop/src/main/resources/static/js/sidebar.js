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

		// 4) 수정·삭제 이벤트 위임
		projectList.addEventListener('click', e => {
			// 수정/삭제 링크를 클릭했을 때만 기본 동작을 막고 처리
			if (e.target.matches('.edit-project') || e.target.matches('.delete-project')) {
				e.preventDefault();
				const id = e.target.dataset.id;
				if (!id) return;

				// 수정
				if (e.target.matches('.edit-project')) {


					const oldName = e.target.closest('.accordion-item')
						.querySelector('.accordion-button').textContent;
					const newName = prompt('프로젝트 이름 수정', oldName);
					if (!newName?.trim()) return;
					fetch('/projects/update', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ projectId: Number(id), projectName: newName.trim() })
					})
						.then(res => res.json())
						.then(updated => {
							e.target.closest('.accordion-item')
								.querySelector('.accordion-button')
								.textContent = updated.projectName;
						})
						.catch(console.error);
				}
				// 삭제
				else {

					if (!confirm('정말 삭제하시겠습니까?')) return;
					fetch(`/projects/delete/${id}`, { method: 'DELETE' })
						.then(() => {
							e.target.closest('.accordion-item').remove();
						})
						.catch(console.error);
				}
			}
		});

		// ─── 프로젝트 리스트 렌더링 ───────────────────────────────────────────
		function appendProject(proj) {
			const clone = template.content.cloneNode(true);
			const item = clone.querySelector('.accordion-item');
			const btn = clone.querySelector('.accordion-button');
			const collapse = clone.querySelector('.accordion-collapse');
			const dropdown = clone.querySelector('[data-bs-toggle="dropdown"]');
			const editLink = clone.querySelector('.edit-project');
			const delLink = clone.querySelector('.delete-project');

			const headerId = `heading-${proj.projectId}`;
			const collapseId = `collapse-${proj.projectId}`;

			item.dataset.id = proj.projectId;
			btn.textContent = proj.projectName;
			btn.setAttribute('data-bs-target', `#${collapseId}`);
			btn.setAttribute('aria-controls', collapseId);

			collapse.id = collapseId;
			collapse.setAttribute('aria-labelledby', headerId);
			collapse.setAttribute('data-bs-parent', '#project-list');

			dropdown.id = `dropdown-${proj.projectId}`;
			clone.querySelector('.dropdown-menu')
				.setAttribute('aria-labelledby', dropdown.id);

			editLink.dataset.id = proj.projectId;
			delLink.dataset.id = proj.projectId;

			projectList.appendChild(item);
		}
		// ────────────────────────────────────────────────────────────────────
	}
})();
