const state = {
    tipoETA: null,
    floculador: { quantidade: 0, volumeCada: 0 },
    decantador: { quantidade: 0, volumeCada: 0 },
    vazao: 0,
    dosagens: { pac: 0, hipo: 0, alc: 0, flu: 0 }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showSection(id) {
    document.querySelectorAll('.section-toggle').forEach(el => {
        el.classList.add('section-hidden');
        el.classList.remove('section-visible');
    });
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('section-hidden');
        el.classList.add('section-visible');
    }
}

function mostrarAlerta(mensagem, tipo = 'error') {
    const container = $('#alert-container');
    if (!container) return;
    const classes = tipo === 'error' ? 'alert alert-error' : 'alert alert-success';
    container.innerHTML = `<div class="${classes}">${mensagem}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

function salvarTipoETA() {
    const selecionado = document.querySelector('.eta-card.selected');
    if (!selecionado) {
        mostrarAlerta('Selecione um tipo de ETA.');
        return;
    }
    state.tipoETA = parseInt(selecionado.dataset.value);
    showSection(`config-eta`);
    const nome = state.tipoETA === 0 ? 'Modular' : 'Torrezan';
    $('#config-title').textContent = `Configuração — ETA ${nome}`;
}

function selecionarETA(el) {
    document.querySelectorAll('.eta-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

function camposPreenchidos(...inputs) {
    for (const input of inputs) {
        if (!input || input.value === '' || parseFloat(input.value) <= 0) {
            return false;
        }
    }
    return true;
}

function calcularVolModular() {
    const qtdFloc = $('#nflocmod');
    const diaFloc = $('#nflocdiamod');
    const hFloc = $('#nflochmod');
    const qtdDec = $('#ndecmod');
    const diaDec = $('#ndecdiamod');
    const hDec = $('#ndechmod');

    if (!camposPreenchidos(qtdFloc, diaFloc, hFloc, qtdDec, diaDec, hDec)) {
        mostrarAlerta('Preencha todos os campos da ETA Modular.');
        return;
    }

    const areaFloc = ((parseFloat(diaFloc.value) / 2) ** 2) * Math.PI;
    const volFloc = areaFloc * parseFloat(hFloc.value);

    const areaDec = ((parseFloat(diaDec.value) / 2) ** 2) * Math.PI;
    const volDec = areaDec * parseFloat(hDec.value);

    state.floculador = { quantidade: parseInt(qtdFloc.value), volumeCada: volFloc };
    state.decantador = { quantidade: parseInt(qtdDec.value), volumeCada: volDec };

    showSection('calculo-dosagem');
}

function calcularVolTorrezan() {
    const cFloc = $('#CompFlocTorrezan');
    const lFloc = $('#LargFlocTorrezan');
    const aFloc = $('#AltFlocTorrezan');
    const qtdDec = $('#iNumDecModulo');
    const cDec = $('#CompDecTorrezan');
    const lDec = $('#LargDecTorrezan');
    const aDec = $('#AltDecTorrezan');

    if (!camposPreenchidos(cFloc, lFloc, aFloc, qtdDec, cDec, lDec, aDec)) {
        mostrarAlerta('Preencha todos os campos da ETA Torrezan.');
        return;
    }

    const volFloc = parseFloat(cFloc.value) * parseFloat(lFloc.value) * parseFloat(aFloc.value);
    const volDec = parseFloat(cDec.value) * parseFloat(lDec.value) * parseFloat(aDec.value);

    state.floculador = { quantidade: 1, volumeCada: volFloc };
    state.decantador = { quantidade: parseInt(qtdDec.value), volumeCada: volDec };

    showSection('calculo-dosagem');
}

function calcularDosagem() {
    const vazao = $('#vazaovol');
    const dosPAC = $('#dosPACvol');
    const dosHIPO = $('#dosHIPOvol');
    const dosALC = $('#dosALCvol');
    const dosFLU = $('#dosFLUvol');

    if (!camposPreenchidos(vazao, dosPAC, dosHIPO, dosALC, dosFLU)) {
        mostrarAlerta('Preencha todos os campos de dosagem.');
        return;
    }

    state.vazao = parseFloat(vazao.value);
    state.dosagens.pac = parseFloat(dosPAC.value);
    state.dosagens.hipo = parseFloat(dosHIPO.value);
    state.dosagens.alc = parseFloat(dosALC.value);
    state.dosagens.flu = parseFloat(dosFLU.value);

    const vazLmin = state.vazao * 60;

    const calcDoses = (valor) => ({
        c100: (valor / vazLmin * 2).toFixed(4),
        c10: (valor / vazLmin * 2 * 10).toFixed(3),
        c1: (valor / vazLmin * 2 * 100).toFixed(2)
    });

    const pac = calcDoses(state.dosagens.pac);
    const hipo = calcDoses(state.dosagens.hipo);
    const alc = calcDoses(state.dosagens.alc);
    const flu = calcDoses(state.dosagens.flu);

    const tempoFloc = parseInt(state.floculador.volumeCada * 1000 / state.vazao);
    const tempoDec = parseInt(state.decantador.volumeCada * 1000 / (state.vazao / state.decantador.quantidade));

    mostrarResultados(pac, hipo, alc, flu, tempoFloc, tempoDec);

    showSection('resultados');
}

function mostrarResultados(pac, hipo, alc, flu, tempoFloc, tempoDec) {
    const preencherTabela = (prefixo, doses) => {
        $(`#${prefixo}100`).textContent = doses.c100;
        $(`#${prefixo}10`).textContent = doses.c10;
        $(`#${prefixo}1`).textContent = doses.c1;
    };

    preencherTabela('resPAC', pac);
    preencherTabela('resHIPO', hipo);
    preencherTabela('resALC', alc);
    preencherTabela('resFLU', flu);

    const nomeETA = state.tipoETA === 0 ? 'Modular' : 'Torrezan';
    $('#TempoFloculador').textContent = `Tempo no Floculador ${nomeETA}: ${tempoFloc} segundos`;
    $('#TempoDecantador').textContent = `Tempo no Decantador ${nomeETA}: ${tempoDec} segundos`;
    $('#VolumeFloculador').textContent = `Volume do Floculador ${nomeETA}: ${state.floculador.volumeCada.toFixed(2)} m³`;
    $('#VolumeDecantador').textContent = `Volume do Decantador ${nomeETA}: ${state.decantador.volumeCada.toFixed(2)} m³`;

    window._resultados = { pac, hipo, alc, flu, tempoFloc, tempoDec };
}

function exportarResultados() {
    const r = window._resultados;
    if (!r) {
        mostrarAlerta('Nenhum resultado para exportar.');
        return;
    }

    const now = new Date();
    const ts = `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
    const nomeArquivo = `JarTest_${ts}.txt`;

    const linhas = [
        'DOSAGENS E TEMPOS UTILIZADOS NO JARTEST',
        '',
        `Dosagem de PAC Concentrada = ${r.pac.c100} mL`,
        `Dosagem de PAC 10% = ${r.pac.c10} mL`,
        `Dosagem de PAC 1% = ${r.pac.c1} mL`,
        '',
        `Dosagem de Hipoclorito na pré Concentrada = ${r.hipo.c100} mL`,
        `Dosagem de Hipoclorito na pré 10% = ${r.hipo.c10} mL`,
        `Dosagem de Hipoclorito na pré 1% = ${r.hipo.c1} mL`,
        '',
        `Dosagem de Alcalinizante Concentrada = ${r.alc.c100} mL`,
        `Dosagem de Alcalinizante 10% = ${r.alc.c10} mL`,
        `Dosagem de Alcalinizante 1% = ${r.alc.c1} mL`,
        '',
        `Dosagem de Fluoreto Concentrada = ${r.flu.c100} mL`,
        `Dosagem de Fluoreto 10% = ${r.flu.c10} mL`,
        `Dosagem de Fluoreto 1% = ${r.flu.c1} mL`,
        '',
        `Tempo do Floculador no Jar Test = ${r.tempoFloc} segundos`,
        `Tempo do Decantador no Jar Test = ${r.tempoDec} segundos`,
        `Volume de cada Floculador da ETA = ${state.floculador.volumeCada.toFixed(2)} m³`,
        `Volume de cada Decantador da ETA = ${state.decantador.volumeCada.toFixed(2)} m³`
    ];

    const conteudo = linhas.join('\r\n');
    const blob = new Blob([conteudo], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
