# build_search.ps1 - V7 (Generates Diagram Translation Map)

Write-Host "Starting Search Indexer V7..." -ForegroundColor Cyan

if (!(Test-Path "js")) { New-Item -ItemType Directory -Force -Path "js" | Out-Null }
$outputFile = "js\search_index.js"
$prefixesToSkip = @("Program:", "System:", "Project:", "Subsystem:", "Function:")

Write-Host "Scanning HTML files..."
$files = Get-ChildItem -Path $PSScriptRoot -Recurse -Filter *.htm

$results = @()      # The Search Index
$diagramMap = @()   # The Filename -> Name lookup
$seenTitles = @{} 
$count = 0

foreach ($file in $files) {
    if ($file.Name -match "^(index|toc|blank|ea_).*\.htm$") { continue }
    
    $content = Get-Content $file.FullName -Raw
    
    # Check if this file is a Diagram Wrapper
    $isDiagramPage = $content -match "class=""diagram_image"""
    
    if ($content -match "<title>(.*?)</title>") {
        $title = $matches[1].Trim()
        
        # Cleanup Title
        if ($title -eq "#TITLE#" -or $title -eq "") { continue }
        if ($title.StartsWith("$")) { continue }
        if ($title -like "*::*") { $parts = $title.Split("::"); $title = $parts[$parts.Length - 1].Trim() }

        # Filter Prefixes
        $hasBadPrefix = $false
        foreach ($prefix in $prefixesToSkip) { if ($title.StartsWith($prefix)) { $hasBadPrefix = $true; break } }
        if ($hasBadPrefix) { continue }

        # --- LOGIC FORK ---
        if ($isDiagramPage) {
            # If it's a diagram, add it to the Translation Map
            # Key = Filename (e.g. "EA5.htm"), Value = Title (e.g. "Eclipse")
            $diagramMap += "`t`"$($file.Name)`": `"$title`""
        }
        else {
            # If it's a Text Page, add it to the Search Index
            # Deduplicate based on title
            if (-not $seenTitles.ContainsKey($title)) {
                $seenTitles[$title] = $true
                $relPath = $file.FullName.Substring($PSScriptRoot.Length + 1).Replace("\", "/")
                $results += "`t{ name: `"$title`", link: `"$relPath`" }"
                $count++
            }
        }
    }
}

# Write JS File
$jsContent = "var globalSearchData = [" + [Environment]::NewLine
$jsContent += ($results | Sort-Object) -join "," + [Environment]::NewLine
$jsContent += "];" + [Environment]::NewLine
$jsContent += "var diagramLookup = {" + [Environment]::NewLine
$jsContent += $diagramMap -join "," + [Environment]::NewLine
$jsContent += "};"

Set-Content -Path $outputFile -Value $jsContent
Write-Host "SUCCESS! Index created at $outputFile" -ForegroundColor Green
Write-Host "Indexed $count text pages and mapped $($diagramMap.Count) diagrams." -ForegroundColor Yellow
Write-Host "Press ENTER to exit..."
Read-Host