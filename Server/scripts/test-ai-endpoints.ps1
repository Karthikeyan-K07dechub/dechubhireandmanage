param(
  [string]$BaseUrl = 'http://localhost:4000',
  [string]$AiToolSecret = 'replace-with-ai-tool-secret',
  [string]$ElevenLabsWebhookSecret = 'replace-with-elevenlabs-webhook-secret'
)

$toolHeaders = @{ 'X-AI-Tool-Secret' = $AiToolSecret; 'Content-Type' = 'application/json' }
$unique = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$marketplace = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/workers/marketplace"
$candidate = @($marketplace.data)[0]
if (-not $candidate) {
  throw 'No eligible marketplace profile is available locally. Create or complete one before running AI talent search tests.'
}

$exactSearch = @{
  role = $candidate.role
  skills = @($candidate.skills | Select-Object -First 2)
  level = 'mid-level'
  conversation_id = "bridge-search-$unique"
} | ConvertTo-Json -Depth 4

Write-Host 'Talent search (exact):'
$exactResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/search-talent" -Headers $toolHeaders -Body $exactSearch
if ($exactResult.match_type -ne 'exact' -or @($exactResult.matches).Count -lt 1 -or @($exactResult.matches).Count -gt 3) {
  throw 'Expected an exact match with one to three profiles.'
}
@($exactResult.matches | ForEach-Object { $_.psobject.Properties.Name }) | ForEach-Object {
  if ($_ -notin @('name', 'role', 'years_of_experience')) { throw "Unexpected talent response field: $_" }
}
$exactResult | ConvertTo-Json -Depth 5

$overlapSkill = @($candidate.skills | Select-Object -First 1)[0]
Write-Host 'Talent search (closest):'
$closestSearch = @{ role = 'Astronaut consultant'; skills = @($overlapSkill); conversation_id = "bridge-closest-$unique" } | ConvertTo-Json -Depth 4
$closestResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/search-talent" -Headers $toolHeaders -Body $closestSearch
if ($closestResult.match_type -ne 'closest') { throw 'Expected a closest skill-overlap match.' }
$closestResult | ConvertTo-Json -Depth 5

Write-Host 'Talent search (none):'
$noneSearch = @{ role = 'Volcanic submarine astronaut'; skills = @(); conversation_id = "bridge-none-$unique" } | ConvertTo-Json -Depth 4
$noneResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/search-talent" -Headers $toolHeaders -Body $noneSearch
if ($noneResult.match_type -ne 'none' -or @($noneResult.matches).Count -ne 0) { throw 'Expected no talent matches.' }
$noneResult | ConvertTo-Json

Write-Host 'Talent search (wrong secret must return 401):'
try {
  Invoke-WebRequest -Method Post -Uri "$BaseUrl/api/ai/visitor/search-talent" -Headers @{ 'X-AI-Tool-Secret' = 'wrong-secret'; 'Content-Type' = 'application/json' } -Body $exactSearch -ErrorAction Stop | Out-Null
  throw 'Expected a 401 response for the wrong AI tool secret.'
} catch {
  if ($_.Exception.Message -eq 'Expected a 401 response for the wrong AI tool secret.') { throw }
  if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
}

$demo = @{
  contact_name = 'Bridge Test Contact'
  work_email = "bridge-test-$unique@example.com"
  project_type = 'web development'
  project_details = 'This is a valid test request for the Bridge Visitor assistant.'
  consent_contact = 'yes'
  consent_marketing_email = 'no'
  channel = 'chat'
  conversation_id = "bridge-test-$unique"
  search_id = $exactResult.search_id
} | ConvertTo-Json

Write-Host 'Demo request:'
$demoResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/demo-request" -Headers $toolHeaders -Body $demo
$demoResult | ConvertTo-Json

Write-Host 'Demo request uses derived company details and links the talent search internally.'

Write-Host 'Expected limits: each visitor route allows 60 requests/minute; the webhook allows 120 requests/minute.'

Write-Host 'Duplicate demo request (must return the same request_id):'
(Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/demo-request" -Headers $toolHeaders -Body $demo) | ConvertTo-Json

$callback = @{
  contact_name = 'Bridge Test Contact'
  work_email = "bridge-test-callback-$unique@example.com"
  question = 'Please call me to discuss a remote team.'
  consent_contact = $true
  channel = 'voice'
  conversation_id = "bridge-callback-$unique"
} | ConvertTo-Json

Write-Host 'Callback request:'
(Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/callback" -Headers $toolHeaders -Body $callback) | ConvertTo-Json

$webhook = @{
  type = 'post_call_transcription'
  event_timestamp = $unique
  data = @{
    agent_id = 'bridge-visitor-test'
    agent_name = 'bridge_visitor'
    conversation_id = "bridge-test-$unique"
    status = 'done'
    transcript = @(@{ role = 'agent'; message = 'Hello'; time_in_call_secs = 0 })
    metadata = @{ start_time_unix_secs = $unique; call_duration_secs = 10 }
    analysis = @{
      call_successful = 'success'
      transcript_summary = 'Test conversation.'
      data_collection_results = @{ consent_contact = @{ value = 'yes' } }
      evaluation_criteria_results = @{}
    }
  }
} | ConvertTo-Json -Depth 10 -Compress

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($ElevenLabsWebhookSecret))
$webhookBytes = [Text.Encoding]::UTF8.GetBytes($webhook)
$signedBytes = [Text.Encoding]::UTF8.GetBytes("$timestamp.") + $webhookBytes
$signatureBytes = $hmac.ComputeHash($signedBytes)
$signature = ([BitConverter]::ToString($signatureBytes) -replace '-', '').ToLowerInvariant()
$webhookHeaders = @{ 'ElevenLabs-Signature' = "t=$timestamp,v0=$signature"; 'Content-Type' = 'application/json' }

Write-Host 'Signed ElevenLabs webhook:'
(Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/webhooks/elevenlabs" -Headers $webhookHeaders -Body $webhookBytes) | ConvertTo-Json
