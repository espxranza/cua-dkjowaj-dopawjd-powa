# Estação meteorológica — ligação USB com o site

## O que foi alterado

O site deixou de gerar dados meteorológicos aleatórios no dashboard. Ele consulta a ponte local `http://127.0.0.1:8765/data`, que é fornecida pelo `capturar_estacao.py`.

O programa Python lê a porta **COM5** do micro:bit central a **115200 baud**, interpreta linhas como:

```text
TEMP:26,UMI:77,VENTO:5,UV:145,PRESSAO:94390
```

e disponibiliza os dados para o navegador. A pressão recebida em Pa é convertida para hPa.

## Como usar

1. Conecte o micro:bit central ao computador por USB.
2. Feche o **Mostrar dispositivo** do MakeCode.
3. Instale o pyserial, se necessário:

```cmd
python -m pip install -r requirements.txt
```

4. Execute:

```cmd
python capturar_estacao.py
```

ou dê duplo clique em `iniciar_estacao.bat`.

5. Abra o site publicado no navegador.
6. O indicador deverá mudar para **Conectado** e os cartões começarão a mostrar os dados reais.

## Sensores usados

- Temperatura: DHT22
- Umidade: DHT22
- Vento: anemômetro com reed switch
- UV: HW-837/GUVA-S12SD (leitura bruta 0–1023)
- Pressão: BMP280

## Observação

A ponte é local de propósito: o computador que possui o micro:bit conectado precisa estar ligado e executar o Python para que o site receba os dados. O histórico exibido pelo navegador é mantido enquanto a página está aberta.
