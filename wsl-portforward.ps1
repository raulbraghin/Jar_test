# =============================================================================
# wsl-portforward.ps1 (Jar Test v2.0)
# Redireciona portas do Windows para os containers Docker rodando no WSL2.
# Execute como Administrador no PowerShell.
# =============================================================================

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# --- Portas a redirecionar para o Jar Test ---
$Ports = @(8002, 8001)

# --- Obtem o IP atual do WSL ---
Write-Host "Obtendo IP do WSL..." -ForegroundColor Cyan
$WslIp = (wsl hostname -I 2>$null).Trim().Split(" ")[0]

if (-not $WslIp) {
    Write-Host "ERRO: Nao foi possivel obter o IP do WSL. Verifique se o WSL esta rodando." -ForegroundColor Red
    exit 1
}

Write-Host "IP do WSL detectado: $WslIp" -ForegroundColor Green

# --- Remove regras antigas e recria com o IP atual ---
foreach ($Port in $Ports) {
    netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 2>$null | Out-Null
    netsh interface portproxy add v4tov4 `
        listenport=$Port `
        listenaddress=0.0.0.0 `
        connectport=$Port `
        connectaddress=$WslIp
    Write-Host "Porta $Port redirecionada para $WslIp`:$Port" -ForegroundColor Green
}

# --- Exibe todas as regras ativas ---
Write-Host "`nRegras de port proxy ativas:" -ForegroundColor Cyan
netsh interface portproxy show all

Write-Host "`nPronto! Acesse no navegador do Windows:" -ForegroundColor Yellow
Write-Host "  Frontend Jar Test -> http://localhost:8002" -ForegroundColor White
Write-Host "  Swagger API       -> http://localhost:8001/docs" -ForegroundColor White
