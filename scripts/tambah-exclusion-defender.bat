@echo off
:: Batch script untuk menambahkan folder proyek SINTAK ke Windows Defender Exclusion
echo Meminta hak administrator...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \"Add-MpPreference -ExclusionPath ''D:\Projects\sintak_pt_buya_barokah''; Write-Host ''SUKSES: Folder D:\Projects\sintak_pt_buya_barokah telah ditambahkan ke Exclusion Windows Defender!''; Start-Sleep -Seconds 3\"'"
echo Selesai.
