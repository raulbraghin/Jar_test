var iTipoETA = ''
var iTipoDOS = ''

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
    else if (tipoEta[2].checked) {

        iTipoETA = 2
        tipoetaselecionada = 'Tipo não disponível'
        //alert('Seleção ' + tipoetaselecionada)

    }
    else {

        iTipoETA = 99
        tipoetaselecionada = 'Nenhuma ETA Selecionada'
        //alert('Seleção ' + tipoetaselecionada)
    }

    MostrarDivTipoETA(iTipoETA) //Chama a Função que mostra a div da ETA

    alert('Seleção ' + iTipoETA)

}

function MostrarDivTipoETA(tipoeta) {

    let mostra = ''

    if (tipoeta == 0) {  //Mostra div Modular

        mostra = document.getElementById("confModular")
        if (mostra.style.display === "none") {
            mostra.style.display = "block"

            mostra = document.getElementById("confTorrezan")
            mostra.style.display = "none"

            mostra = document.getElementById("confOutros")
            mostra.style.display = "none"

            //alert('Mostra Modular')
        }
    } else if (tipoeta == 1) {    //Mostra div Torrezan

        mostra = document.getElementById("confTorrezan")
        if (mostra.style.display === "none") {
            mostra.style.display = "block"

            mostra = document.getElementById("confModular")
            mostra.style.display = "none"

            mostra = document.getElementById("confOutros")
            mostra.style.display = "none"

            //alert('Mostra Torrezan')
        }
    } else if (tipoeta == 2) {   //Mostra div Outros

        mostra = document.getElementById("confOutros")
        if (mostra.style.display === "none") {
            mostra.style.display = "block"

            mostra = document.getElementById("confTorrezan")
            mostra.style.display = "none"

            mostra = document.getElementById("confModular")
            mostra.style.display = "none"

            //alert('Mostra Outros')
        }
    } else if (tipoeta == 99) {   //Não mostra nenhuma Div

        mostra = document.getElementById("confModular")
        mostra.style.display = "none"

        mostra = document.getElementById("confTorrezan")
        mostra.style.display = "none"

        mostra = document.getElementById("confOutros")
        mostra.style.display = "none"

        //alert('Não Mostrar Nenhum')
    }


}

function CalcularVolModular() {

    let iQuantFlocmod = document.querySelector('input#nflocmod')
    let fdiaFlocmod   = document.querySelector('input#nflocdiamod')
    let fhFlocmod     = document.querySelector('input#nflochmod')

    let fareaFlocMod = ((parseFloat(fdiaFlocmod.value)/2.0)**2)*Math.PI
    let fvolFlocMod = fareaFlocMod * parseFloat(fhFlocmod.value)    //Volume individual de cada decantador
    let fVolTotalFlocMod = iQuantFlocmod * fvolFlocMod              //Volume total dos decantadores em serie


    let iQuantDecMod = document.querySelector('input#ndecmod')
    let fdiaDecMod = document.querySelector('input#ndecdiamod')
    let fhDecMod = document.querySelector('input#ndechmod')

    let fareaDecMod = ((parseFloat(fdiaDecMod.value)/2.0)**2)*Math.PI
    let fvolDecMod = fareaDecMod * parseFloat(fhDecMod.value)
    let fVolTotalDecMod = iQuantFlocmod * fvolFlocMod

    //verifica se todos os campos foram preenchidos e retorne true se tudo ok
    let TudoPre = preenchCampoindexmodular(iQuantFlocmod,fdiaFlocmod,fhFlocmod,iQuantDecMod,fdiaDecMod,fhDecMod)

    if (TudoPre == true){   //se todos os campos preenchidos, mostra link
        let mostra = document.getElementById("CalculoDosagem")
        mostra.style.display = "block"
        
    }
    //alert(`Área do Floculador ${fareaDecMod} e volume ${fvolDecMod}`)
}

function preenchCampoindexmodular(v1,v2,v3,v4,v5,v6) {

    if (v1.value == ''){
        alert('Preencher todos os campos')
    } else if (v2.value == ''){
        alert('Preencher todos os campos')
    } else if (v3.value == ''){
        alert('Preencher todos os campos')
    } else if (v4.value == ''){
        alert('Preencher todos os campos')
    } else if (v5.value == ''){
        alert('Preencher todos os campos')
    } else if (v6.value == ''){
        alert('Preencher todos os campos')
    } else {
        return true
    }

}

function SalvaTipoCalculo() {
    let tipoDOS = document.getElementsByName('selecaodos')

    //let iTipoDOS = ''

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
}

function Calculo(){

    alert('variável alert ' + iTipoETA)
    alert('variável alert ' + iTipoDOS)

    if (iTipoETA==0 && iTipoDOS==0){  //ETA Modular por volume
        calcdosETAModVol()
        alert('calcdosETAModVol')
    } else if (iTipoETA==0 && iTipoDOS==1){   //ETA Modular por concentração
        calcdosETAModCon()
        alert('calcdosETAModCon')
    } else if (iTipoETA==1 && iTipoDOS==0){
        calcdosETATorrezanVol()
        alert('calcdosETATorrezanVol')
    } else if (iTipoETA==1 && iTipoDOS==1){
        calcdosETATorrezanCon()
        alert('calcdosETATorrezanCon')
    }
     else if (iTipoETA==2){
        calculodosagemETAx()
        alert('calcdosETATorrezanCon')
    }

}

function calcdosETAModVol() {

    let vazao = document.querySelector("input#vazaovol")
    let dosPAC = document.querySelector("input#dosPACvol")
    let dosHIPO = document.querySelector("input#dosHIPOvol")
    let dosALC = document.querySelector("input#dosALCvol")
    let dosFLU = document.querySelector("input#dosFLUvol")

    let calcular = preenchCampoindexmodular(vazao,dosPAC,dosHIPO,dosALC,dosFLU,0)

    if (calcular == true){
        let vazlmin = parseint(vazao.value) * 60

        let PAC100 = parseInt(dosPAC.value) / vazlmin
        let PAC10 = PAC100 * 10
        let PAC1 = PAC100 * 100
    
        let HIPO100 = parseint(dosHIPO.value) / vazlmin
        let HIPO10 = HIPO100 * 10
        let HIPO1 = HIPO100 * 100
    
        let ALC100 = parseint(dosALC.value) / vazlmin
        let ALC10 = ALC100 * 10
        let ALC1 = ALC100 * 100
    
        let FLU100 = parseint(dosFLU.value) / vazlmin
        let FLU10 = FLU100 * 10
        let FLU1 = FLU100 * 100

        let mostra = document.getElementById("dosJarTest")
        mostra.style.display = "block"
        
        mostraresultado(PAC100,PAC10,PAC1,HIPO100,HIPO10,HIPO1,ALC100,ALC10,ALC1,FLU100,FLU10,FLU1)
    
    }



}

function mostraresultado(PAC100,PAC10,PAC1,HIPO100,HIPO10,HIPO1,ALC100,ALC10,ALC1,FLU100,FLU10,FLU1) {

    let resPAC100 = querySelector("p#resPAC100")
    let resPAC10 = querySelector("p#resPAC10")
    let resPAC1 = querySelector("p#resPAC1")

    resPAC100.innerHTML = PAC100
    resPAC10.innerHTML = PAC1
    resPAC1.innerHTML = PAC1

}