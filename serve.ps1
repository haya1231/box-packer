param(
  [int]$Port = 8080
)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix (Ctrl+C to stop)"

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      $localPath = $request.Url.LocalPath
      if ($localPath -eq '/') { $localPath = '/index.html' }
      $filePath = Join-Path $root ($localPath.TrimStart('/') -replace '/', '\')

      if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        if ($request.HttpMethod -ne 'HEAD') {
          $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $response.ContentLength64 = $notFound.Length
        if ($request.HttpMethod -ne 'HEAD') {
          $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
      }
    } catch {
      Write-Host "Request error: $_"
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
}
