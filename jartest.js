function SalvaTipoETA() {

    let tipoEta = document.getElementsByName('selecao')

    let tipoetaselecionada = ''
    let iTipoETA = ''

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
        let mostra = document.getElementById("linkpc")
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

    let iTipoDOS = ''

    if (tipoDOS[0].checked) {

        iTipoDOS = 0


    }
    else if (tipoDOS[1].checked) {

        iTipoDOS = 1

    }
}

function calculo(){

    if (SalvaTipoETA.iTipoETA==0 && SalvaTipoCalculo.iTipoDOS==0){  //ETA Modular por volume
        calcdosETAModVol()
    } else if (SalvaTipoETA.iTipoETA==0 && SalvaTipoCalculo.iTipoDOS==1){   //ETA Modular por concentração
        calcdosETAModCon()
    } else if (SalvaTipoETA.iTipoETA==1 && SalvaTipoCalculo.iTipoDOS==0){
        calcdosETATorrezanVol()
    } else if (SalvaTipoETA.iTipoETA==1 && SalvaTipoCalculo.iTipoDOS==1){
        calcdosETATorrezanCon()
    }
     else if (SalvaTipoETA.iTipoETA==2){
        calculodosagemETAx()
    }

}

function calculodosagemETAModular() {



}