function Send-OTP {
 param($TO,$CODE)
 $h=@{Authorization="Bearer $TOKEN"}
 $b=@{
  messaging_product="whatsapp"
  to=$TO
  type="template"
  template=@{
   name="hello_world"
   language=@{code="en_US"}
  }
 }
 $json = $b | ConvertTo-Json -Depth 4
 Invoke-RestMethod -Uri "https://graph.facebook.com/v25.0/$ID/messages" -Method Post -Headers $h -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -ContentType "application/json; charset=utf-8"
}
