// admin.js - 관리자 페이지 전용 JavaScript

// ───────────── 전역 변수 설정 ─────────────
// pendingIds: 초대 대기 상태인 유저 ID 리스트
// approvedIds: 이미 프로젝트에 승인된 유저 ID 리스트
// projectId: 현재 프로젝트 ID (HTML 요소에 data-project-id로 전달되어야 함)
const pendingIds = window.pendingIds || [];
const approvedIds = window.approvedIds || [];
const projectId = document.getElementById("projectInfo")?.dataset?.projectId || 1;

// ───────────── 초대 모달 열기 ─────────────
function openInviteUserModal() {
  fetch('/admin/invite/users') // 초대 가능한 사용자 목록 요청
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('inviteUserList');
      list.innerHTML = ''; // 목록 초기화

      data.forEach(user => {
        const isPending = pendingIds.includes(user.id);     // 초대 대기 중인지 여부
        const isApproved = approvedIds.includes(user.id);   // 이미 승인된 멤버인지 여부

        let actionHtml;
        if (isApproved) {
          actionHtml = `<span style="color:gray;">멤버</span>`;
        } else if (isPending) {
          actionHtml = `<span style="color:gray;">대기중</span>`;
        } else {
          // 초대 가능 사용자
          actionHtml = `<button class="btn btn-sm btn-primary" onclick="sendInvite(${user.id})">초대</button>`;
        }

        // 테이블 row 구성
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style='padding:.5rem;border:1px solid #ddd;'>${user.nickname}</td>
          <td style='padding:.5rem;border:1px solid #ddd;'>${user.email}</td>
          <td style='padding:.5rem;border:1px solid #ddd;text-align:center;'>${actionHtml}</td>`;
        list.appendChild(row);
      });

      // 모달 열기
      document.getElementById('inviteModal').style.display = 'block';
    });
}

// ───────────── 초대 모달 닫기 ─────────────
function closeInviteModal() {
  document.getElementById('inviteModal').style.display = 'none';
}

// ───────────── 초대 전송 기능 ─────────────
function sendInvite(userId) {
  if (!confirm('정말 초대하시겠습니까?')) return;

  fetch('/admin/invite/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ receiverId: userId, projectId: projectId })
  })
  .then(r => {
    if (!r.ok) throw new Error();
    alert('초대 완료!');
    location.reload();
  })
  .catch(() => alert('초대 실패'));
}

// ───────────── 권한 변경 기능 ─────────────
function submitChangeRole(event, userId) {
  const selectEl = document.getElementById('roleSelect' + userId);
  const newRole = selectEl.value;

  if (!confirm('권한을 변경하시겠습니까?')) return;

  fetch(`/admin/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ userId, role: newRole, projectId })
  })
  .then(r => {
    if (!r.ok) throw new Error();
    alert('권한 변경 완료!');
    location.reload();
  })
  .catch(() => alert('권한 변경 실패'));
}

// ───────────── 팀원 추방 기능 ─────────────
function confirmKick(projectMemberId) {
  if (!confirm('정말로 이 사용자를 추방하시겠습니까?')) return;

  fetch('/admin/kick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ projectMemberId })
  })
  .then(r => {
    if (!r.ok) throw new Error();
    alert('추방 완료되었습니다.');
    location.reload();
  })
  .catch(() => alert('추방 실패'));
}

// ───────────── 초대 수락 기능 ─────────────
function handleAcceptInvite(button) {
  const inviteId = button.getAttribute('data-invite-id');

  fetch('/admin/invite/accept', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ inviteId })
  })
  .then(r => {
    if (!r.ok) throw new Error();
    return r.text();
  })
  .then(msg => {
    alert(msg);
    location.reload();
  })
  .catch(() => alert('초대 수락 실패'));
}

// ───────────── 초대 거절 기능 ─────────────
function handleDeclineInvite(button) {
  const inviteId = button.getAttribute('data-invite-id');

  fetch('/admin/invite/decline', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ inviteId })
  })
  .then(r => {
    if (!r.ok) throw new Error();
    return r.text();
  })
  .then(msg => {
    alert(msg);
    location.reload();
  })
  .catch(() => alert('초대 거절 실패'));
}

// 프로젝트 관리 관련 ---------------------------------------------------------
// 편집 중인 프로젝트 ID 보관
let currentEditId = null;

/**
 * 프로젝트 수정 모달 열기
 * @param {number|string} id - 프로젝트 ID
 * @param {string} name - 기존 프로젝트명
 */
function openEditProjectModal(id, name) {
  currentEditId = id;
  const input = document.getElementById('editProjectNameInput');
  input.value = name;
  input.classList.remove('is-invalid');
  new bootstrap.Modal(
    document.getElementById('editProjectModal')
  ).show();
}

/**
 * 프로젝트 삭제 처리 (메인 컨트롤러 DELETE)
 * @param {number|string} id - 프로젝트 ID
 */
function confirmDeleteProject(id) {
  if (!confirm('정말 이 프로젝트를 삭제하시겠습니까?')) return;

  fetch(`/projects/delete/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error();
      // 테이블 행 제거
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) row.remove();
      // 사이드바 탭 제거
      const tab = document.querySelector(`.project-tab[data-id="${id}"]`);
      if (tab) tab.remove();
    })
    .catch(() => alert('삭제에 실패했습니다.'));
}

// 수정 저장 버튼 처리 (메인 컨트롤러 PUT)
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('confirmEditProjectBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const input = document.getElementById('editProjectNameInput');
    const newName = input.value.trim();
    if (!newName) {
      input.classList.add('is-invalid');
      return;
    }

    fetch('/projects/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentEditId, projectName: newName })
    })
      .then(res => {
        if (!res.ok) throw new Error();
        // 테이블 행 텍스트 갱신
        const row = document.querySelector(`tr[data-id="${currentEditId}"]`);
        if (row) row.children[1].textContent = newName;
        // 사이드바 탭 텍스트 갱신
        const tabName = document.querySelector(
          `.project-tab[data-id="${currentEditId}"] .project-name`
        );
        if (tabName) tabName.textContent = newName;
      })
      .catch(() => alert('수정에 실패했습니다.'))
      .finally(() => {
        // 모달 닫기
        const modalEl = document.getElementById('editProjectModal');
        bootstrap.Modal.getInstance(modalEl).hide();
      });
  });
});


