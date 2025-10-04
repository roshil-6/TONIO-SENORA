# PowerShell Web Server for PWA Testing
$port = 8080
$url = "http://localhost:$port"

Write-Host "🚀 Starting PWA Test Server..." -ForegroundColor Green
Write-Host "📱 Server URL: $url" -ForegroundColor Yellow
Write-Host "🌐 Main App: $url/index.html" -ForegroundColor Cyan
Write-Host "🔍 Test Page: $url/test-pwa.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the web server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url + "/")
$listener.Start()

Write-Host "✅ Server started successfully!" -ForegroundColor Green
Write-Host ""

# Open the test page automatically
Start-Process "$url/test-pwa.html"
Start-Process "$url/index.html"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path $PWD $localPath.TrimStart('/')
        
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $response.ContentType = "text/html"
            $response.StatusCode = 200
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $errorContent = "File not found: $localPath"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorContent)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "🛑 Server stopped." -ForegroundColor Red
}


