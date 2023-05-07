/*
link ara geração do arquivo para gravar os dados
https://egghead.io/lessons/node-js-write-or-append-to-a-file-in-node-js-with-fs-writefile-and-fs-writefilesync
*/

//const { Console } = require('console')

/*
link para utilização das funções export e import
https://blog.betrybe.com/tecnologia/import-e-export/#:~:text=Para%20importar%20qualquer%20vari%C3%A1vel%20ou,erro%20na%20execu%C3%A7%C3%A3o%20do%20c%C3%B3digo.
*/


//Variáveis globais
var iTipoETA = ''
var iTipoDOS = ''

var QuantidadeFlocETAModular
var VolCadaFlocModular
var QuantidadeDecETAModular
var VolCadaDecModular

var VolCadaFlocTorrezan
var QuantidadeDecETATorrezan
var VolCadaDecTorrezan

//var CalculoConcentracao = false

function SalvaTipoETA() {

    let tipoEta = document.getElementsByName('selecao')

    //let tipoetaselecionada = ''
    //let iTipoETA = ''

    if (tipoEta[0].checked) {

        iTipoETA = 0
        tipoetaselecionada = 'Modular'
        //alert('Seleção ' + tipoetaselecionada)


    }
    else if (tipoEta[1].checked) {

        iTipoETA = 1
        tipoetaselecionada = 'Torrezan'
        //alert('Seleção ' + tipoetaselecionada)

    }
    else {

        iTipoETA = 99
        tipoetaselecionada = 'Nenhuma ETA Selecionada'
        alert('Nenhuma opção selecionada.')
    }

    MostrarDivTipoETA(iTipoETA) //Chama a Função que mostra a div da ETA

    /*
    if (iTipoETA != 99) {
        alert('Seleção ' + iTipoETA)
    }*/


}

function MostrarDivTipoETA(tipoeta) {

    let mostra = ''

    if (tipoeta == 0) {  //Mostra div Modular

        mostra = document.getElementById("confModular")
        if (mostra.style.display === "none") {
            mostra.style.display = "block"

            mostra = document.getElementById("confTorrezan")
            mostra.style.display = "none"

            //alert('Mostra Modular')
        }
    } else if (tipoeta == 1) {    //Mostra div Torrezan

        mostra = document.getElementById("confTorrezan")
        if (mostra.style.display === "none") {
            mostra.style.display = "block"

            mostra = document.getElementById("confModular")
            mostra.style.display = "none"

            //alert('Mostra Torrezan')
        }
    } else if (tipoeta == 99) {   //Não mostra nenhuma Div

        mostra = document.getElementById("confModular")
        mostra.style.display = "none"

        mostra = document.getElementById("confTorrezan")
        mostra.style.display = "none"

        //alert('Não Mostrar Nenhum')
    }


}

function CalcularVolModular() {

    let iQuantFlocmod = document.querySelector('input#nflocmod')
    let fdiaFlocmod = document.querySelector('input#nflocdiamod')
    let fhFlocmod = document.querySelector('input#nflochmod')

    let fareaFlocMod = ((parseFloat(fdiaFlocmod.value) / 2.0) ** 2) * Math.PI
    let fvolFlocMod = fareaFlocMod * parseFloat(fhFlocmod.value)    //Volume individual de cada floculador
    let fVolTotalFlocMod = iQuantFlocmod * fvolFlocMod              //Volume total dos floculadores em serie


    let iQuantDecMod = document.querySelector('input#ndecmod')
    let fdiaDecMod = document.querySelector('input#ndecdiamod')
    let fhDecMod = document.querySelector('input#ndechmod')

    let fareaDecMod = ((parseFloat(fdiaDecMod.value) / 2.0) ** 2) * Math.PI
    let fvolDecMod = fareaDecMod * parseFloat(fhDecMod.value)
    let fVolTotalDecMod = iQuantFlocmod * fvolFlocMod

    //verifica se todos os campos foram preenchidos e retorne true se tudo ok
    let TudoPre = PreencCampos(iQuantFlocmod, fdiaFlocmod, fhFlocmod, iQuantDecMod, fdiaDecMod, fhDecMod)

    if (TudoPre == true) {   //se todos os campos preenchidos, mostra link
        let mostra = document.getElementById("CalculoDosagem")
        mostra.style.display = "block"
        console.log(`Área do Floculador ${fareaDecMod} e volume ${fvolDecMod}`)
    }

    //Manda valores para variáveis globais
    QuantidadeFlocETAModular = iQuantFlocmod.value;
    VolCadaFlocModular = fvolFlocMod;
    QuantidadeDecETAModular = iQuantDecMod.value;
    VolCadaDecModular = fvolDecMod;

}

function CalcularVolTorrezan() {

    //alert('Função Calculo VolTorrezan')

    let fCompFloculador = document.querySelector('input#CompFlocTorrezan')
    let fLargFloculador = document.querySelector('input#LargFlocTorrezan')
    let fAltFloculador = document.querySelector('input#AltFlocTorrezan')

    let fVolFloculador = parseFloat(fCompFloculador.value) * parseFloat(fLargFloculador.value) * parseFloat(fAltFloculador.value)

    console.log(fVolFloculador)

    let iNumeroDecantadores = document.querySelector('input#iNumDecMódulo')
    let fCompDecantador = document.querySelector('input#CompDecTorrezan')
    let fLargDecantador = document.querySelector('input#LargDecTorrezan')
    let fAltDecantador = document.querySelector('input#AltDecTorrezan')

    let fVolDecantador = parseFloat(fCompDecantador.value) * parseFloat(fLargDecantador.value) * parseFloat(fAltDecantador.value)

    console.log(fVolDecantador)

    //verifica se todos os campos foram preenchidos e retorne true se tudo ok
    let TudoPre = PreencCampos(fCompFloculador, fLargFloculador, fAltFloculador, fCompDecantador, fLargDecantador, fAltDecantador)

    console.log(TudoPre)

    if (TudoPre == true) {   //se todos os campos preenchidos, mostra link
        let mostra = document.getElementById("CalculoDosagem")
        mostra.style.display = "block"
        console.log(`Volume do Floculador é ${fVolFloculador} e do decantador é ${fVolDecantador}`)
    }

    //Manda valores para variáveis globais
    VolCadaFlocTorrezan = fVolFloculador
    QuantidadeDecETATorrezan = iNumeroDecantadores.value
    VolCadaDecTorrezan = fVolDecantador

}



function Calculo() {

    console.log('variável alert iTipoEta = ' + iTipoETA)
    //console.log('variável alert iTipoDos = ' + iTipoDOS)

    if (iTipoETA == 0 /*&& iTipoDOS == 0*/) {  //ETA Modular por volume

        console.log('calcdosETAModVol')
        CalcDosETAModVol()

    } /*else if (iTipoETA == 0 && iTipoDOS == 1) {   //ETA Modular por concentração
        calcdosETAModCon()
        console.log('calcdosETAModCon')

    } */else if (iTipoETA == 1 /*&& iTipoDOS == 0*/) {
        calcdosETATorrezanVol()
        console.log('calcdosETATorrezanVol')

    } /*else if (iTipoETA == 1 && iTipoDOS == 1) {
        calcdosETATorrezanCon()
        console.log('calcdosETATorrezanCon')
    }*/

}

function CalcDosETAModVol() {

    let vazao = document.querySelector('input#vazaovol')
    let dosPAC = document.querySelector('input#dosPACvol')
    let dosHIPO = document.querySelector('input#dosHIPOvol')
    let dosALC = document.querySelector('input#dosALCvol')
    let dosFLU = document.querySelector('input#dosFLUvol')

    let calcular = PreencCampos(vazao, dosPAC, dosHIPO, dosALC, dosFLU, 0)

    console.log('Dentro da função Calc')
    console.log('Resultado de calcular ' + calcular)
    console.log(vazao.value + ',' + dosPAC.value + ',' + dosHIPO.value + ',' + dosALC.value + ',' + dosFLU.value)

    if (calcular == true) {

        console.log('Dentro da função Calc if calcular')

        /* CONVERTE VAZÃO DE L/S PARA L/MIN */
        let vazlmin = parseInt(vazao.value) * 60

        /* CONCENTRAÇÃO DE PRODUTO 100%, DILUIDO 10% E DILUIDO 1% */

        let PAC100 = (parseInt(dosPAC.value) / vazlmin * 2).toFixed(4)
        let PAC10 = (PAC100 * 10).toFixed(3)
        let PAC1 = (PAC100 * 100).toFixed(2)

        let HIPO100 = (parseInt(dosHIPO.value) / vazlmin * 2).toFixed(4)
        let HIPO10 = (HIPO100 * 10).toFixed(3)
        let HIPO1 = (HIPO100 * 100).toFixed(2)

        let ALC100 = (parseInt(dosALC.value) / vazlmin * 2).toFixed(4)
        let ALC10 = (ALC100 * 10).toFixed(3)
        let ALC1 = (ALC100 * 100).toFixed(2)

        let FLU100 = (parseInt(dosFLU.value) / vazlmin * 2).toFixed(4)
        let FLU10 = (FLU100 * 10).toFixed(3)
        let FLU1 = (FLU100 * 100).toFixed(2)

        /* Calculo de tempo*/
        let iTempoFloc = parseInt(VolCadaFlocModular * 1000 / vazao.value)
        let itempoDec = parseInt(VolCadaDecModular * 1000 / (vazao.value / QuantidadeDecETAModular))

        console.log(itempoDec)
        console.log(iTempoFloc)


        let mostra = document.getElementById("dosJarTest")
        mostra.style.display = "block"

        mostraresultado(PAC100, PAC10, PAC1, HIPO100, HIPO10, HIPO1, ALC100, ALC10, ALC1, FLU100, FLU10, FLU1, iTempoFloc, itempoDec)

    }


}


function calcdosETATorrezanVol() {


    let vazao = document.querySelector('input#vazaovol')
    let dosPAC = document.querySelector('input#dosPACvol')
    let dosHIPO = document.querySelector('input#dosHIPOvol')
    let dosALC = document.querySelector('input#dosALCvol')
    let dosFLU = document.querySelector('input#dosFLUvol')

    let calcular = PreencCampos(vazao, dosPAC, dosHIPO, dosALC, dosFLU, 0)

    console.log('Dentro da função calcdosETATorrezanVol')
    console.log('Resultado de calcular ' + calcular)
    console.log(vazao.value + ',' + dosPAC.value + ',' + dosHIPO.value + ',' + dosALC.value + ',' + dosFLU.value)

    if (calcular == true) {

        console.log('Dentro da função Calc if calcular')

        /* CONVERTE VAZÃO DE L/S PARA L/MIN */
        let vazlmin = parseInt(vazao.value) * 60

        /* CONCENTRAÇÃO DE PRODUTO 100%, DILUIDO 10% E DILUIDO 1% */

        let PAC100 = (parseInt(dosPAC.value) / vazlmin * 2).toFixed(4)
        let PAC10 = (PAC100 * 10).toFixed(3)
        let PAC1 = (PAC100 * 100).toFixed(2)

        let HIPO100 = (parseInt(dosHIPO.value) / vazlmin * 2).toFixed(4)
        let HIPO10 = (HIPO100 * 10).toFixed(3)
        let HIPO1 = (HIPO100 * 100).toFixed(2)

        let ALC100 = (parseInt(dosALC.value) / vazlmin * 2).toFixed(4)
        let ALC10 = (ALC100 * 10).toFixed(3)
        let ALC1 = (ALC100 * 100).toFixed(2)

        let FLU100 = (parseInt(dosFLU.value) / vazlmin * 2).toFixed(4)
        let FLU10 = (FLU100 * 10).toFixed(3)
        let FLU1 = (FLU100 * 100).toFixed(2)

        /* Calculo de tempo*/
        let iTempoFloc = parseInt(VolCadaFlocTorrezan * 1000 / vazao.value)
        let itempoDec = parseInt(VolCadaDecTorrezan * 1000 / (vazao.value / QuantidadeDecETATorrezan))

        console.log(itempoDec)
        console.log(iTempoFloc)


        let mostra = document.getElementById("dosJarTest")
        mostra.style.display = "block"

        mostraresultado(PAC100, PAC10, PAC1, HIPO100, HIPO10, HIPO1, ALC100, ALC10, ALC1, FLU100, FLU10, FLU1, iTempoFloc, itempoDec)

    }


}


function mostraresultado(PAC100, PAC10, PAC1, HIPO100, HIPO10, HIPO1, ALC100, ALC10, ALC1, FLU100, FLU10, FLU1, iTempoFloc, itempoDec) {

    let resPAC100 = document.querySelector("td#resPAC100")
    let resPAC10 = document.querySelector("td#resPAC10")
    let resPAC1 = document.querySelector("td#resPAC1")

    let resHIPO100 = document.querySelector("td#resHIPO100")
    let resHIPO10 = document.querySelector("td#resHIPO10")
    let resHIPO1 = document.querySelector("td#resHIPO1")

    let resALC100 = document.querySelector("td#resALC100")
    let resALC10 = document.querySelector("td#resALC10")
    let resALC1 = document.querySelector("td#resALC1")

    let resFLU100 = document.querySelector("td#resFLU100")
    let resFLU10 = document.querySelector("td#resFLU10")
    let resFLU1 = document.querySelector("td#resFLU1")

    let TempoFloc = document.querySelector("p#TempoFloculador")
    let tempoDec = document.querySelector("p#TempoDecantador")

    let VolFloculador = document.querySelector("p#VolumeFloculador")
    let VolDecantador = document.querySelector("p#VolumeDecantador")


    resPAC100.innerHTML = PAC100
    resPAC10.innerHTML = PAC10
    resPAC1.innerHTML = PAC1

    resHIPO100.innerHTML = HIPO100
    resHIPO10.innerHTML = HIPO10
    resHIPO1.innerHTML = HIPO1

    resALC100.innerHTML = ALC100
    resALC10.innerHTML = ALC10
    resALC1.innerHTML = ALC1

    resFLU100.innerHTML = FLU100
    resFLU10.innerHTML = FLU10
    resFLU1.innerHTML = FLU1


    if (iTipoETA == 0) {    //Se 0 então ETA Modular senão ETA torrezan
        TempoFloc.innerHTML = `O Tempo de cada floculador modular é ${iTempoFloc} segundos`
    } else {
        TempoFloc.innerHTML = `O Tempo do floculador torrezan é ${iTempoFloc} segundos`
    }

    if (iTipoETA == 0) {
        tempoDec.innerHTML = `O Tempo de cada Decantador modular é ${itempoDec} segundos`
    } else {
        tempoDec.innerHTML = `O Tempo de cada Decantador torrezan é ${itempoDec} segundos`
    }

    var VolumeDecantadorETA
    var VolumeFloculadorETA

    if (iTipoETA == 0) {
        VolFloculador.innerHTML = `O volume de cada floculador modular é ${VolCadaFlocModular.toFixed(2)} m3`
        VolumeFloculadorETA = VolCadaFlocModular.toFixed(2)
    } else {
        VolFloculador.innerHTML = `O volume do floculador torrezan é ${VolCadaFlocTorrezan.toFixed(2)} m3`
        VolumeFloculadorETA = VolCadaFlocTorrezan.toFixed(2)
    }

    if (iTipoETA == 0) {
        VolDecantador.innerHTML = `O volume de cada Decantador modular é ${VolCadaDecModular.toFixed(2)} m3`
        VolumeDecantadorETA = VolCadaDecModular.toFixed(2)
    } else {
        VolDecantador.innerHTML = `O volume de cada Decantador torrezan é ${VolCadaDecTorrezan.toFixed(2)} m3`
        VolumeDecantadorETA = VolCadaDecTorrezan.toFixed(2)
    }

    var NomeArquivo = NomeArquivoTexto()

    ExportarValores(
        PAC100,
        PAC10,
        PAC1,
        HIPO100,
        HIPO10,
        HIPO1,
        ALC100,
        ALC10,
        ALC1,
        FLU100,
        FLU10,
        FLU1,
        iTempoFloc,
        itempoDec,
        VolumeFloculadorETA,
        VolumeDecantadorETA,
        NomeArquivo
    )



}

function PreencCampos(v1, v2, v3, v4, v5, v6) {

    if (v1.value == '' || v2.value == '' || v3.value == '' || v4.value == '' || v5.value == '' || v6.value == '') {
        alert('Preencher todos os campos')
    } else {
        return true
    }

}


function ExportarValores(PAC100, PAC10, PAC1, HIPO100, HIPO10, HIPO1, ALC100, ALC10, ALC1, FLU100, FLU10, FLU1, iTempoFloc, itempoDec, VolumeFloculadorETA, VolumeDecantadorETA, NomeArquivo) {

    console.log('Dentro da Função ExportarValores')

    var DadosProcesso = new Array(16)
    var DadosConcatenados = "DOSAGENS E TEMPOS UTILIZADOS NO JARTEST\r\n"

    DadosProcesso[0] = 'Dosagem de PAC Concentrada = ' + String(PAC100) + 'mL'
    DadosProcesso[1] = 'Dosagem de PAC 10% = ' + String(PAC10) + 'mL'
    DadosProcesso[2] = 'Dosagem de PAC 1% = ' + String(PAC1) + 'mL'
    DadosProcesso[3] = 'Dosagem de Hipoclorito na pré Concentrada = ' + String(HIPO100) + 'mL'
    DadosProcesso[4] = 'Dosagem de Hipoclorito na pré 10% = ' + String(HIPO10) + 'mL'
    DadosProcesso[5] = 'Dosagem de Hipoclorito na pré 1% = ' + String(HIPO1) + 'mL'
    DadosProcesso[6] = 'Dosagem de Alcalinizante Concentrada = ' + String(ALC100) + 'mL'
    DadosProcesso[7] = 'Dosagem de Alcalinizante 10% = ' + String(ALC10) + 'mL'
    DadosProcesso[8] = 'Dosagem de Alcalinizante 1% = ' + String(ALC1) + 'mL'
    DadosProcesso[9] = 'Dosagem de Fluoreto Concentrada = ' + String(FLU100) + 'mL'
    DadosProcesso[10] = 'Dosagem de Fluoreto 10% = ' + String(FLU10) + 'mL'
    DadosProcesso[11] = 'Dosagem de Fluoreto 1% = ' + String(FLU1) + 'mL'
    DadosProcesso[12] = 'Tempo do Floculador no Jar Test ' + String(iTempoFloc) + ' segundos'
    DadosProcesso[13] = 'Tempo do Decantador no Jar Test ' + String(itempoDec) + ' segundos'
    DadosProcesso[14] = 'Volume de cada Floculador da ETA ' + String(VolumeFloculadorETA) + ' m³'
    DadosProcesso[15] = 'Volume de cada Decantador da ETA ' + String(VolumeDecantadorETA) + ' m³'

    /*for (let i = 0; i < DadosProcesso.length; i++) {

        console.log(DadosProcesso[i])

    }*/

    for (let i = 0; i < DadosProcesso.length; i++) {

        DadosConcatenados += DadosProcesso[i] + "\r\n"  

    }

    DownloadFile(DadosConcatenados, NomeArquivo)

}

function NomeArquivoTexto() {

    console.log('Dentro Função NomeArquivoTexto')

    var DataAtualizada = new Date()

    var dia = String(DataAtualizada.getDate())
    var mes = String(DataAtualizada.getMonth())
    var ano = String(DataAtualizada.getFullYear())
    var hora = String(DataAtualizada.getHours())
    var minuto = String(DataAtualizada.getMinutes())
    var segundo = String(DataAtualizada.getSeconds())

    var NomeArquivo = 'JarTest_' + ano + '_' + mes + '_' + dia + '_' + hora + '_' + minuto + '_' + segundo + '.txt'

    console.log(NomeArquivo);

    return NomeArquivo


}


//Salvar o arquivo gerado
function DownloadFile(data, file_name, file_type) {
    if (!file_type) {
        file_type = 'application/octet-stream';
    }

    var file = new Blob([data], { type: file_type });
    var a = document.createElement("a"),
        url = URL.createObjectURL(file);
    a.href = url;
    a.download = file_name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

