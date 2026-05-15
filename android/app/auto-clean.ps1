$targetPath = "c:\Users\HELLO\OneDrive\Desktop\HomeChef\HomeChef-FE\android\app\build"
Write-Output "Starting background delete monitor..."

for ($i = 1; $i -le 60; $i++) {
    if (!(Test-Path $targetPath)) {
        Write-Output "SUCCESS: The build directory has been cleared!"
        exit 0
    }
    
    try {
        Remove-Item -Recurse -Force $targetPath -ErrorAction Stop
        Write-Output "SUCCESS: The build directory has been deleted!"
        exit 0
    } catch {
        Write-Output "Attempt ${i}: Folder is still locked."
        Start-Sleep -Seconds 2
    }
}

Write-Output "TIMEOUT: Could not delete folder."
exit 1
