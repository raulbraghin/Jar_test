/*
link ara geração do arquivo para gravar os dados
https://egghead.io/lessons/node-js-write-or-append-to-a-file-in-node-js-with-fs-writefile-and-fs-writefilesync
*/

/*
link para utilização das funções export e import
https://blog.betrybe.com/tecnologia/import-e-export/#:~:text=Para%20importar%20qualquer%20vari%C3%A1vel%20ou,erro%20na%20execu%C3%A7%C3%A3o%20do%20c%C3%B3digo.
*/

//export var DadosProcesso = []  //Dados a serem exportados

//Variáveis globais
var iTipoETA = ''
var iTipoDOS = ''

var QuantidadeFlocETAModular
var VolCadalFlocModular
var QuantidadeDecETAModular
var VolCadaDecModular

var VolCadalFlocTorrezan
var QuantidadeDecETATorrezan
var VolCadaDecTorrezan

var CalculoConcentracao = false

function SalvaTipoETA() {

    let tipoEta = document.getElementsByName('selecao')

    let tipoetaselecionada = ''
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

    if (iTipoETA != 99) {
        alert('Seleção ' + iTipoETA)
    }


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
    let fvolFlocMod = fareaFlocMod * parseFloat(fhFlocmod.value)    //Volume individual de cada decantador
    let fVolTotalFlocMod = iQuantFlocmod * fvolFlocMod              //Volume total dos decantadores em serie


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
    VolCadalFlocModular = fvolFlocMod;
    QuantidadeDecETAModular = iQuantDecMod.value;
    VolCadaDecModular = fvolDecMod;

}

function CalcularVolTorrezan() {

    alert('Função Calculo VolTorrezan')

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
    VolCadalFlocTorrezan = fVolFloculador
    QuantidadeDecETATorrezan = iNumeroDecantadores.value
    VolCadaDecTorrezan = fVolDecantador

}


/*
function SalvaTipoCalculo() {

    let tipoDOS = document.getElementsByName('selecaodos')


    if (tipoDOS[0].checked) {

        iTipoDOS = 0

        let mostra = document.getElementById("etavol")
        mostra.style.display = "block"

        mostra = document.getElementById("etacon")
        mostra.style.display = "none"

    }
    else if (tipoDOS[1].checked) {

        iTipoDOS = 1

        let mostra = document.getElementById("etacon")
        mostra.style.display = "block"

        mostra = document.getElementById("etavol")
        mostra.style.display = "none"

    }
}*/



function Calculo() {

    console.log('variável alert iTipoEta = ' + iTipoETA)
    console.log('variável alert iTipoDos = ' + iTipoDOS)

    if (iTipoETA == 0 && iTipoDOS == 0) {  //ETA Modular por volume

        console.log('calcdosETAModVol')
        CalcDosETAModVol()

    } else if (iTipoETA == 0 && iTipoDOS == 1) {   //ETA Modular por concentração
        calcdosETAModCon()
        console.log('calcdosETAModCon')

    } else if (iTipoETA == 1 && iTipoDOS == 0) {
        calcdosETATorrezanVol()
        console.log('calcdosETATorrezanVol')

    } else if (iTipoETA == 1 && iTipoDOS == 1) {
        calcdosETATorrezanCon()
        console.log('calcdosETATorrezanCon')
    }

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
        let iTempoFloc = parseInt(VolCadalFlocModular * 1000 / vazao.value)
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
        let iTempoFloc = parseInt(VolCadalFlocTorrezan * 1000 / vazao.value)
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

    /*
    resPAC100.innerHTML = `Para uma dosagem de PAC concentrado, você deve dosar ${PAC100} mL`
    resPAC10.innerHTML = `Para uma dosagem de PAC diluido a 10%, você deve dosar ${PAC10} mL`
    resPAC1.innerHTML = `Para uma dosagem de PAC diluido a 1%, você deve dosar ${PAC1} mL`

    resHIPO100.innerHTML = `Para uma dosagem de hipoclorito concentrado, você deve dosar ${HIPO100} mL`
    resHIPO10.innerHTML = `Para uma dosagem de hipoclorito diluido a 10%, você deve dosar ${HIPO10} mL`
    resHIPO1.innerHTML = `Para uma dosagem de hipoclorito diluido a 1%, você deve dosar ${HIPO1} mL`

    resALC100.innerHTML = `Para uma dosagem de alcalinizante concentrado, você deve dosar ${ALC100} mL`
    resALC10.innerHTML = `Para uma dosagem de alcalinizante diluido a 10%, você deve dosar ${ALC10} mL`
    resALC1.innerHTML = `Para uma dosagem de alcalinizante diluido a 1%, você deve dosar ${ALC1} mL`

    resFLU100.innerHTML = `Para uma dosagem de Ácido Fluorsilíssico concentrado, você deve dosar ${FLU100} mL`
    resFLU10.innerHTML = `Para uma dosagem de Ácido Fluorsilíssico diluido a 10%, você deve dosar ${FLU10} mL`
    resFLU1.innerHTML = `Para uma dosagem de Ácido Fluorsilíssico diluido a 1%, você deve dosar ${FLU1} mL`
    */

    if (iTipoETA == 0) {
        TempoFloc.innerHTML = `O Tempo de cada floculador modular é ${iTempoFloc} segundos`
    } else {
        TempoFloc.innerHTML = `O Tempo do floculador torrezan é ${iTempoFloc} segundos`
    }

    if (iTipoETA == 0) {
        tempoDec.innerHTML = `O Tempo de cada Decantador modular é ${itempoDec} segundos`
    } else {
        tempoDec.innerHTML = `O Tempo de cada Decantador torrezan é ${itempoDec} segundos`
    }

    if (iTipoETA == 0) {
        VolFloculador.innerHTML = `O volume de cada floculador modular é ${VolCadalFlocModular.toFixed(2)} m3`
    } else {
        VolFloculador.innerHTML = `O volume do floculador torrezan é ${VolCadalDecModular.toFixed(2)} m3`
    }

    if (iTipoETA == 0) {
        VolDecantador.innerHTML = `O volume de cada Decantador modular é ${VolCadaDecModular.toFixed(2)} m3`
    } else {
        VolDecantador.innerHTML = `O volume de cada Decantador torrezan é ${VolCadaDecModular.toFixed(2)} m3`
    }

    ExportarValores(
        resPAC100.innerHTML,
        resPAC10.innerHTML,
        resPAC1.innerHTML,
        resHIPO100.innerHTML,
        resHIPO10.innerHTML,
        resHIPO1.innerHTML,
        resALC100.innerHTML,
        resALC10.innerHTMLALC10,
        resALC1.innerHTML,
        resFLU100.innerHTML,
        resFLU10.innerHTML,
        resFLU1.innerHTML,
        TempoFloc.innerHTML,
        tempoDec.innerHTML,
        VolFloculador.innerHTML,
        VolDecantador.innerHTML,
        iTipoETA
    )

    //downloadFiles('Raul Braghin','texte','txt')

}

function ExportarValores(PAC100, PAC10, PAC1, HIPO100, HIPO10, HIPO1, ALC100, ALC10, ALC1, FLU100, FLU10, FLU1,) {

    DadosProcesso[0] = PAC100;
    DadosProcesso[1] = PAC10;
    DadosProcesso[2] = PAC1;
    DadosProcesso[3] = HIPO100;
    DadosProcesso[4] = HIPO10;
    DadosProcesso[5] = HIPO1;
    DadosProcesso[6] = ALC100;
    DadosProcesso[7] = ALC10;
    DadosProcesso[8] = ALC1;
    DadosProcesso[9] = FLU100;
    DadosProcesso[10] = FLU10;
    DadosProcesso[11] = FLU1;
    DadosProcesso[12] = iTempoFloc;
    DadosProcesso[13] = itempoDec;
    DadosProcesso[14] = Volfloc;
    DadosProcesso[15] = VolDec;
    DadosProcesso[16] = iTipoETA;

}


function PreencCampos(v1, v2, v3, v4, v5, v6) {

    if (v1.value == '' || v2.value == '' || v3.value == '' || v4.value == '' || v5.value == '' || v6.value == '') {
        alert('Preencher todos os campos')
    } else {
        return true
    }

}

//Salvar o arquivo gerado
function downloadFiles(data, file_name, file_type) {
    var file = new Blob([data], { type: file_type });
    if (window.navigator.msSaveOrOpenBlob)
        window.navigator.msSaveOrOpenBlob(file, file_name);
    else {
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
}
