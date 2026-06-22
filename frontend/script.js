const API_URL = 'https://psicoedu-backend.vercel.app';
let usuario = null;

// ========== FUNÇÕES DE TELA ==========
function abrirTela(id) {
    // Esconder todas as telas
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    
    // Limpar TODOS os inputs, selects e textareas
    const todosInputs = document.querySelectorAll('input, select, textarea');
    todosInputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit' && input.type !== 'hidden') {
            input.value = '';
        }
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
            // Se for select de horário, desabilitar
            if (input.id === 'horarioSelect') {
                input.disabled = true;
                input.innerHTML = '<option value="">Primeiro selecione psicólogo e data</option>';
            }
        }
    });
    
    // Mostrar a tela selecionada
    document.getElementById(id).classList.remove('hidden');
}

function abrirCadastroAluno() {
    document.getElementById('nomeAluno').value = '';
    document.getElementById('emailAluno').value = '';
    document.getElementById('senhaAluno').value = '';
    const selectTurma = document.getElementById('turmaAluno');
    if (selectTurma) selectTurma.selectedIndex = 0;
    abrirTela('cadAluno');
}

function abrirCadastroPsi() {
    document.getElementById('nomePsi').value = '';
    document.getElementById('emailPsi').value = '';
    document.getElementById('senhaPsi').value = '';
    abrirTela('cadPsi');
}

function abrirLoginAluno() {
    document.getElementById('emailAlunoLogin').value = '';
    document.getElementById('senhaAlunoLogin').value = '';
    abrirTela('loginAluno');
}

function abrirLoginPsi() {
    document.getElementById('emailPsiLogin').value = '';
    document.getElementById('senhaPsiLogin').value = '';
    abrirTela('loginPsi');
}

function mostrarMensagem(mensagem, tipo) {
    const div = document.createElement('div');
    div.className = `mensagem ${tipo}`;
    div.innerText = mensagem;
    const container = document.querySelector('.container:not(.hidden)');
    if (container) {
        container.insertBefore(div, container.firstChild);
        setTimeout(() => div.remove(), 3000);
    }
}

function toggleSenha(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function fazerLogout() {
    usuario = null;
    abrirTela('inicio');
}

function mostrarAgendar() {
    document.getElementById('agendarDiv').style.display = 'block';
    document.getElementById('meusAgendamentosDiv').style.display = 'none';
}

function mostrarMeusAgendamentos() {
    document.getElementById('agendarDiv').style.display = 'none';
    document.getElementById('meusAgendamentosDiv').style.display = 'block';
    carregarAgendamentosAluno();
}

// ========== CARREGAR TURMAS ==========
async function carregarTurmasSelect() {
    try {
        const response = await fetch(`${API_URL}/turmas`);
        const turmas = await response.json();
        const select = document.getElementById('turmaAluno');
        if (select) {
            select.innerHTML = '<option value="">Selecione sua turma</option>';
            turmas.forEach(turma => {
                select.innerHTML += `<option value="${turma.id}">${turma.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
    }
}

// ========== CARREGAR PSICÓLOGOS ==========
async function carregarPsicologos() {
    try {
        const response = await fetch(`${API_URL}/psicologos`);
        const psicologos = await response.json();
        const select = document.getElementById('psicologoSelect');
        select.innerHTML = '<option value="">Selecione o psicólogo</option>';
        psicologos.forEach(psi => {
            select.innerHTML += `<option value="${psi.id}">${psi.nome}</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar psicólogos:', error);
    }
}

// ========== CARREGAR HORÁRIOS ==========
async function carregarHorarios() {
    const psicologoId = document.getElementById('psicologoSelect').value;
    const data = document.getElementById('dataAgendamento').value;
    const selectHorario = document.getElementById('horarioSelect');

    if (!psicologoId || !data) {
        selectHorario.disabled = true;
        selectHorario.innerHTML = '<option value="">Primeiro selecione psicólogo e data</option>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/horarios/disponiveis?psicologo_id=${psicologoId}&data=${data}`);
        const horarios = await response.json();

        selectHorario.disabled = false;
        selectHorario.innerHTML = '<option value="">Selecione o horário</option>';

        if (horarios.length === 0) {
            selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>';
        } else {
            horarios.forEach(horario => {
                const horaFormatada = horario.hora.substring(0, 5);
                selectHorario.innerHTML += `<option value="${horario.hora}">${horaFormatada}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        selectHorario.disabled = true;
    }
}

// ========== AGENDAMENTOS DO ALUNO ==========
async function carregarAgendamentosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${usuario.id}/agendamentos`);
        const agendamentos = await response.json();
        const container = document.getElementById('listaAgendamentosAluno');

        if (agendamentos.length === 0) {
            container.innerHTML = '<p>Você não tem agendamentos.</p>';
            return;
        }

        container.innerHTML = '';
        agendamentos.forEach(ag => {
            const dataFormatada = new Date(ag.data).toLocaleDateString('pt-BR');
            const horaFormatada = ag.hora.substring(0, 5);
            container.innerHTML += `
                <div class="agendamento-card">
                    <strong>Psicólogo: ${ag.psicologo_nome}</strong><br>
                    <strong>Data:</strong> ${dataFormatada}<br>
                    <strong>Horário:</strong> ${horaFormatada}<br>
                    <strong>Status:</strong> <span class="status ${ag.status}">${ag.status}</span><br>
                    ${ag.motivo ? `<strong>Motivo:</strong> ${ag.motivo}<br>` : ''}
                    ${ag.status === 'agendado' ? `<button onclick="cancelarAgendamento(${ag.id})" class="btn-cancelar">Cancelar</button>` : ''}
                </div>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}

// ========== AGENDAMENTOS DO PSICÓLOGO ==========
async function carregarAgendamentosPsi() {
    try {
        const response = await fetch(`${API_URL}/psicologos/${usuario.id}/agendamentos`);
        const agendamentos = await response.json();
        const container = document.getElementById('listaAgendamentosPsi');

        if (agendamentos.length === 0) {
            container.innerHTML = '<p>Nenhum agendamento para exibir.</p>';
            return;
        }

        container.innerHTML = '';
        agendamentos.forEach(ag => {
            const dataFormatada = new Date(ag.data).toLocaleDateString('pt-BR');
            const horaFormatada = ag.hora.substring(0, 5);
            container.innerHTML += `
                <div class="agendamento-card">
                    <strong>Aluno: ${ag.aluno_nome}</strong><br>
                    <strong>Data:</strong> ${dataFormatada}<br>
                    <strong>Horário:</strong> ${horaFormatada}<br>
                    <strong>Status:</strong> <span class="status ${ag.status}">${ag.status}</span><br>
                    ${ag.motivo ? `<strong>Motivo:</strong> ${ag.motivo}<br>` : ''}
                </div>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}

// ========== CADASTROS ==========
async function cadastrarAluno() {
    const nome = document.getElementById('nomeAluno').value;
    const email = document.getElementById('emailAluno').value;
    const senha = document.getElementById('senhaAluno').value;
    const turma_id = document.getElementById('turmaAluno').value;

    if (!nome || !email || !senha || !turma_id) {
        mostrarMensagem('Preencha todos os campos', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, tipo: 'aluno', turma_id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        mostrarMensagem('Cadastro realizado! Faça login.', 'sucesso');
        abrirTela('inicio');
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

async function cadastrarPsi() {
    const nome = document.getElementById('nomePsi').value;
    const email = document.getElementById('emailPsi').value;
    const senha = document.getElementById('senhaPsi').value;

    if (!nome || !email || !senha) {
        mostrarMensagem('Preencha todos os campos', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, tipo: 'psicologo' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        mostrarMensagem('Cadastro realizado! Faça login.', 'sucesso');
        abrirTela('inicio');
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

// ========== LOGINS ==========
async function fazerLoginAluno() {
    const email = document.getElementById('emailAlunoLogin').value;
    const senha = document.getElementById('senhaAlunoLogin').value;

    if (!email || !senha) {
        mostrarMensagem('Preencha todos os campos', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        usuario = data.usuario;
        if (usuario.tipo !== 'aluno') throw new Error('Esta conta não é de aluno');
        mostrarMensagem('Login realizado!', 'sucesso');
        await carregarPsicologos();
        await carregarAgendamentosAluno();
        abrirTela('alunoArea');
        mostrarAgendar();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

async function entrarPsi() {
    const email = document.getElementById('emailPsiLogin').value;
    const senha = document.getElementById('senhaPsiLogin').value;

    if (!email || !senha) {
        mostrarMensagem('Preencha todos os campos', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        usuario = data.usuario;
        if (usuario.tipo !== 'psicologo') throw new Error('Esta conta não é de psicólogo');
        mostrarMensagem('Login realizado!', 'sucesso');
        await carregarAgendamentosPsi();
        abrirTela('psiArea');
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

// ========== AGENDAMENTO ==========
async function criarAgendamento() {
    const psicologo_id = document.getElementById('psicologoSelect').value;
    const data = document.getElementById('dataAgendamento').value;
    const hora = document.getElementById('horarioSelect').value;
    const motivo = document.getElementById('motivoAgendamento').value;

    if (!psicologo_id || !data || !hora) {
        mostrarMensagem('Selecione psicólogo, data e horário', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aluno_id: usuario.id, psicologo_id: parseInt(psicologo_id), data, hora, motivo })
        });
        const dataResponse = await response.json();
        if (!response.ok) throw new Error(dataResponse.mensagem);
        mostrarMensagem('Agendamento realizado!', 'sucesso');
        document.getElementById('dataAgendamento').value = '';
        document.getElementById('motivoAgendamento').value = '';
        document.getElementById('psicologoSelect').value = '';
        document.getElementById('horarioSelect').innerHTML = '<option value="">Primeiro selecione psicólogo e data</option>';
        document.getElementById('horarioSelect').disabled = true;
        await carregarAgendamentosAluno();
        mostrarMeusAgendamentos();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

async function cancelarAgendamento(id) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/${id}/cancelar`, { method: 'PUT' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        mostrarMensagem('Agendamento cancelado!', 'sucesso');
        await carregarAgendamentosAluno();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

async function excluirConta() {
    if (!confirm('Tem certeza que deseja excluir sua conta?')) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuario.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir conta');
        mostrarMensagem('Conta excluída!', 'sucesso');
        fazerLogout();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
}

// ========== EVENTOS ==========
document.getElementById('psicologoSelect')?.addEventListener('change', carregarHorarios);
document.getElementById('dataAgendamento')?.addEventListener('change', carregarHorarios);

// Inicializar
carregarTurmasSelect();