import urllib.request, json
r = urllib.request.urlopen('https://api.telegram.org/bot8668300882:AAECxEIAVwQ5E_sR9JJNg1rGuoQnexfHUkQ/getUpdates')
d = json.loads(r.read())
print(d['result'][-1]['message']['text'])
