# Instalação dos Serviços 

## Crie um Banco de dados Postgres e importe as tabelas do diretório BD
Pode ser usado o comando pg_restore em banco de dados existente conforme abaixo : 

```
pg_restore -U postgres -d srv -v bd/backup.dump
```
## Ajustes nos arquivos de configuração 

### IPFS Client

1)Ajustar o .env no diretório ipfs-client conforme abaixo :

```
DB_USER = usuario do banco
DB_HOST = localhost
DB_DATABASE = nome do banco
DB_PASSWORD = senha do banco
DB_PORT = porta do banco
DB_DIALECT = postgres
IPFS_AUTH_TOKEN="Token de post/get no IPFS para passar no Token Bearer, tem que ser igual a tabela token"
IPFS_UPLOAD_METADATA = 'http://127.0.0.1:6000/'
ENTRYPOINT_ADDRESS = "contrato de entrypoint"
ERC4337_ADDRESS = "contrato ERC4337"
OWNER_PRIVATE_KEY = "Chave primaria do Owner dos contratos ERC4337 e Entrypoint"
```

2)Ajustar a porta padrão no arquivo index.js conforme abaixo:

```
const port = 3000; 
```
3)Instalar os pacotes de dependencias
```
npm install
```
4)Executar o serviço de API
```
node index.js
```

## Testar as chamadas de API

1)Importar no Insomnia o arquivo da pasta insomnia
2)Na autenticação é necessário passar como Token Bearer os endereço de wallet contidos na tabela "tokens"

