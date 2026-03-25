$filePath = 'd:\Code\todo-think\client\src\views\system\organization\index.vue'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
# Remove lines 338 to 361 (0-indexed: 337 to 360) - the empty handleRemoveManager shell and duplicate declarations
$newLines = $lines[0..336] + $lines[361..($lines.Length-1)]
[System.IO.File]::WriteAllLines($filePath, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "Done. New total lines: $($newLines.Length)"
Write-Host "Line 336: $($newLines[335])"
Write-Host "Line 337: $($newLines[336])"
Write-Host "Line 338: $($newLines[337])"
Write-Host "Line 339: $($newLines[338])"
Write-Host "Line 340: $($newLines[339])"
