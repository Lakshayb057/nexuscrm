$files = @(
    'src/pages/Settings.js',
    'src/pages/Receipts.js',
    'src/pages/Payments.js',
    'src/pages/MonthlyDonations.js',
    'src/pages/Organizations.js',
    'src/pages/Journeys.js',
    'src/pages/Donations.js',
    'src/pages/Contacts.js',
    'src/pages/Channels.js',
    'src/pages/Campaigns.js',
    'src/pages/Agencies.js',
    'src/components/MonthlyDonationNotification.js'
)

foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        (Get-Content $fullPath) -replace "from 'react-query'", "from '@tanstack/react-query'" | Set-Content $fullPath
        Write-Host "Updated: $file"
    } else {
        Write-Host "File not found: $file"
    }
}
