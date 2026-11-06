param(
  [string]$BaseUrl = 'http://localhost:4000',
  [string]$AiToolSecret = 'replace-with-ai-tool-secret',
  [string]$ElevenLabsWebhookSecret = 'replace-with-elevenlabs-webhook-secret'
)

$toolHeaders = @{ 'X-AI-Tool-Secret' = $AiToolSecret; 'Content-Type' = 'application/json' }
$unique = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$demo = @{
  company_name = "Bridge test company $unique"
  company_website = 'example.com'
  contact_name = 'Bridge Test Contact'
  work_email = "bridge-test-$unique@example.com"
  project_type = 'web development'
  project_details = 'This is a valid test request for the Bridge Visitor assistant.'
  consent_contact = 'yes'
  consent_marketing_email = 'no'
  channel = 'chat'
  conversation_id = "bridge-test-$unique"
} | ConvertTo-Json

Write-Host 'Demo request:'
$demoResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/ai/visitor/demo-request" -Headers $toolHeaders -Body $demo
$demoResult | ConvertTo-Json

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
