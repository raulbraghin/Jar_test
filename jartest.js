function SalvaTipoETA() {

    var tipoEta = document.getElementsByName('selecao')

    var tipoetaselecionada = ''

    if (tipoEta[0].checked){
    
        tipoetaselecionada = 'Modular'
        alert('Seleção ' + tipoetaselecionada)
    }
    else if (tipoEta[1].checked){

        tipoetaselecionada = 'Torrezan'
        alert('Seleção ' + tipoetaselecionada)

    }
    else if (tipoEta[2].checked){

        tipoetaselecionada = 'Tipo não disponível'
        alert('Seleção ' + tipoetaselecionada)

    }
    else {

        tipoetaselecionada = 'Nenhuma ETA Selecionada'
        alert('Seleção ' + tipoetaselecionada)
    }
    

}