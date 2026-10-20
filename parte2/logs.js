// Parte 2 — API de logs da UNOESC / Piway.
// Informe sua própria matrícula no campo da página. Não use a matrícula dos exemplos.
const PIWAY = 'https://www.piway.com.br/unoesc/api';
const matriculaInput = document.querySelector('#matricula');
const avisoLogs = document.querySelector('#avisoLogs');
const logsContainer = document.querySelector('#logs');
matriculaInput.value = localStorage.getItem('futstats_matricula') || '466382';
function matricula() {
  const valor = matriculaInput.value.trim();
  if (!/^\d+$/.test(valor)) {
    avisoLogs.textContent = 'Digite uma matrícula numérica válida para utilizar os logs.';
    return null;
  }
  return valor;
}
document.querySelector('#salvarMatricula').addEventListener('click', () => {
  const numero = matricula();
  if (numero) {
    localStorage.setItem('futstats_matricula', numero);
    avisoLogs.textContent = 'Matrícula salva neste navegador.';
  }
});
async function solicitarLog(caminho) {
  const resposta = await fetch(`${PIWAY}/${caminho}`);
  if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
  const corpo = await resposta.text();
  try { return JSON.parse(corpo); } catch { return corpo; }
}
function resumoResultado(dados) {
  if (dados === null || dados === undefined) return 'Sem dados';
  if (Array.isArray(dados)) return `${dados.length} resultados`;
  if (typeof dados === 'object') {
    const chave = Object.keys(dados).find(k => Array.isArray(dados[k]));
    if (chave) return `${dados[chave]?.length || 0} resultados (${chave})`;
    return String(dados.strTeam || dados.strLeague || dados.message || 'Consulta concluída');
  }
  return String(dados);
}
async function registrarLog(operacao, dados) {
  const numero = matricula();
  if (!numero) return;
  const parametros = [numero, 'TheSportsDB', operacao, resumoResultado(dados)].map(encodeURIComponent);
  try {
    const resposta = await solicitarLog(`inserir/log/${parametros.join('/')}`);
    avisoLogs.textContent = `Registro de consulta: ${typeof resposta === 'string' ? resposta : JSON.stringify(resposta)}`;
  } catch (erro) {
    avisoLogs.textContent = `Consulta esportiva concluída, mas não foi possível registrar log: ${erro.message}`;
  }
}
function campoLog(obj, nomes) {
  for (const nome of nomes) if (obj?.[nome] !== undefined && obj[nome] !== null) return String(obj[nome]);
  return '';
}
async function listarLogs() {
  const numero = matricula();
  if (!numero) return;
  logsContainer.replaceChildren();
  avisoLogs.textContent = 'Carregando histórico...';
  try {
    const retorno = await solicitarLog(`logs/${encodeURIComponent(numero)}`);
    const lista = Array.isArray(retorno) ? retorno : (retorno?.logs || retorno?.data || retorno?.resultado);
    if (!Array.isArray(lista)) {
      avisoLogs.textContent = `Resposta da API: ${typeof retorno === 'string' ? retorno : JSON.stringify(retorno)}`;
      return;
    }
    avisoLogs.textContent = `${lista.length} log(s) encontrado(s).`;
    if (!lista.length) return;
    lista.forEach(log => {
      const id = campoLog(log, ['idlog','idLog','id_log','IDLOG','id','codigo']);
      const cartao = document.createElement('article'); cartao.className = 'card';
      const titulo = document.createElement('h3'); titulo.textContent = campoLog(log,['api','API','nome_api']) || 'Consulta de API';
      const descricao = document.createElement('p');
      descricao.textContent = Object.entries(log).map(([chave, valor]) => `${chave}: ${String(valor)}`).join(' | ');
      cartao.append(titulo, descricao);
      if (id) {
        const botao = document.createElement('button'); botao.textContent = `Excluir log ${id}`;
        botao.addEventListener('click', () => excluirLog(id)); cartao.append(botao);
      }
      logsContainer.append(cartao);
    });
  } catch (erro) { avisoLogs.textContent = `Falha ao listar logs: ${erro.message}`; }
}
async function excluirLog(id) {
  const numero = matricula(); if (!numero) return;
  if (!confirm(`Deseja excluir o log ${id}?`)) return;
  try {
    const retorno = await solicitarLog(`excluir/log/${encodeURIComponent(id)}/aluno/${encodeURIComponent(numero)}`);
    avisoLogs.textContent = typeof retorno === 'string' ? retorno : JSON.stringify(retorno);
    await listarLogs();
  } catch (erro) { avisoLogs.textContent = `Falha ao excluir log: ${erro.message}`; }
}
document.querySelector('#verLogs').addEventListener('click', listarLogs);
