
const BASE = 'https://www.thesportsdb.com/api/v1/json/123/';

const resultado = document.querySelector('#resultado');
const statusEl = document.querySelector('#status');

function texto(tag, valor) {
  const el = document.createElement(tag);
  el.textContent = valor ?? 'Não informado';
  return el;
}

async function consultar(endpoint) {
  statusEl.textContent = 'Carregando dados...';
  resultado.replaceChildren();

  try {
    const resposta = await fetch(BASE + endpoint);

    if (!resposta.ok) {
      throw Error('HTTP ' + resposta.status);
    }

    const dados = await resposta.json();

    statusEl.textContent = 'Consulta concluída.';

    if (typeof registrarLog === 'function') {
      await registrarLog(endpoint, dados);
    }

    return dados;

  } catch (erro) {
    statusEl.textContent = 'Erro na consulta: ' + erro.message;
    return null;
  }
}

function card(titulo, descricao, imagem) {
  const div = document.createElement('article');
  div.className = 'card';

  if (imagem) {
    const img = document.createElement('img');
    img.src = imagem;
    img.alt = titulo;
    img.loading = 'lazy';
    div.append(img);
  }

  div.append(
    texto('h3', titulo),
    texto('p', descricao)
  );

  resultado.append(div);
  return div;
}

async function ligas() {
  const dados = await consultar('all_leagues.php');

  if (!dados) return;

  (dados.leagues || []).slice(0, 40).forEach(l => {
    card(l.strLeague, l.strSport);
  });
}

async function filtrar() {
  const pais = document.querySelector('#pais').value;

  const dados = await consultar(
    'search_all_leagues.php?c=' +
    encodeURIComponent(pais) +
    '&s=Soccer'
  );

  if (!dados) return;

  (dados.countries || []).forEach(l => {
    card(l.strLeague, l.strCountry);
  });

  if (!dados.countries?.length) {
    statusEl.textContent = 'Nenhuma liga encontrada.';
  }
}

async function times() {
  const dados = await consultar(
    'search_all_teams.php?l=English_Premier_League'
  );

  if (!dados) return;

  (dados.teams || []).forEach(t => {
    const div = card(
      t.strTeam,
      t.strStadium || t.strCountry,
      t.strBadge
    );

    const botao = texto('button', 'Ver detalhes e elenco');

    botao.addEventListener('click', () => detalhes(t.idTeam));

    div.append(botao);
  });

  if (!dados.teams?.length) {
    statusEl.textContent = 'Nenhum time encontrado.';
  }
}

async function detalhes(id) {
  const dados = await consultar(
    'lookupteam.php?id=' + encodeURIComponent(id)
  );

  if (!dados) return;

  const t = dados.teams?.[0];

  if (!t) {
    statusEl.textContent = 'Equipe não encontrada.';
    return;
  }

  card(
    t.strTeam,
    `Estádio: ${t.strStadium || '-'} |
     Fundação: ${t.intFormedYear || '-'} |
     Liga: ${t.strLeague || '-'}`,
    t.strBadge
  );

  const botao = texto('button', 'Consultar jogadores');

  botao.addEventListener('click', () => jogadores(id));

  resultado.append(botao);
}

async function jogadores(id) {
  const dados = await consultar(
    'lookup_all_players.php?id=' + encodeURIComponent(id)
  );

  if (!dados) return;

  (dados.player || []).forEach(p => {
    card(p.strPlayer, p.strPosition, p.strThumb);
  });

  if (!dados.player?.length) {
    statusEl.textContent = 'Nenhum jogador encontrado.';
  }
}

document.querySelector('#ligas')
  .addEventListener('click', ligas);

document.querySelector('#filtrar')
  .addEventListener('click', filtrar);

document.querySelector('#times')
  .addEventListener('click', times);
