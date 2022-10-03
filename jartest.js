function SalvaTipoETA() {

    var tipoEta = document.getElementsByName('selecao')

    var tipoetaselecionada = ''
    var iTipoETA = ''

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

    var mostra = ''

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
    var iQuantFlocmod = document.querySelector('input#nflocmod')
    var fdiaFlocmod   = document.querySelector('input#nflocdiamod')
    var fhFlocmod     = document.querySelector('input#nflochmod')

    var iQuantDecMod = document.querySelector('input#ndecmod')
    var fdiaDecMod = document.querySelector('input#ndecdiamod')
    var fhDecMod = document.querySelector('input#ndechmod')

    let fareaFlocMod = ((parseFloat(fdiaFlocmod.value)/2.0)**2)*Math.PI
    let fvolFlocMod = fareaFlocMod * parseFloat(fhFlocmod.value)

    alert(`Área do Floculador ${fareaFlocMod} e volume ${fvolFlocMod}`)
}