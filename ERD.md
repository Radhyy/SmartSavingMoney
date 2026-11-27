# Entity Relationship Diagram (ERD) - Smart Tabungan

### Versi 1: ERD Bersih (Hitam Putih / Netral & Garis Panah Biasa)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TD
    subgraph TABEL_DATABASE [" "]
        direction TB

        rfid_cards["<b>rfid_cards</b><hr/><b>PK</b> id : bigint<br/><b>UK</b> uid : text<br/>owner_name : text<br/>phone_number : text<br/>created_at : timestamptz"]

        rfid_events["<b>rfid_events</b><hr/><b>PK</b> id : bigint<br/>card_uid : text<br/>event : text (known/unknown)<br/>created_at : timestamptz"]

        suspicious_activities["<b>suspicious_activities</b><hr/><b>PK</b> id : bigint<br/>card_uid : text<br/>type : text<br/>attempts : smallint<br/>detail : text<br/>created_at : timestamptz<br/>emailed_at : timestamptz"]

        transactions["<b>transactions</b><hr/><b>PK</b> id : bigint<br/><b>UK</b> client_txn_id : text<br/>type : text (deposit/expense)<br/>amount : bigint<br/>description : text<br/>created_at : timestamptz"]

        savings_target["<b>savings_target</b><hr/><b>PK</b> id : int<br/>amount : bigint<br/>updated_at : timestamptz"]

        users["<b>users (Supabase Auth)</b><hr/><b>PK</b> id : uuid<br/>email : varchar<br/>raw_user_meta_data : jsonb<br/>created_at : timestamptz"]
    end

    %% Relasi Garis Biasa (1 ke N)
    rfid_cards -->|"1 : N"| rfid_events
    rfid_events -->|"memicu alert (>4x)"| suspicious_activities

    classDef default fill:#ffffff,stroke:#333333,stroke-width:1.5px,color:#111111;
```

---

### Versi 2: Format `erDiagram` Netral (Hitam Putih, Garis Lurus Sederhana)

```mermaid
%%{init: {'theme': 'neutral'}}%%
erDiagram
    rfid_cards {
        bigint id PK
        text uid UK
        text owner_name
        text phone_number
        timestamptz created_at
    }

    rfid_events {
        bigint id PK
        text card_uid
        text event
        timestamptz created_at
    }

    suspicious_activities {
        bigint id PK
        text card_uid
        text type
        smallint attempts
        text detail
        timestamptz created_at
        timestamptz emailed_at
    }

    transactions {
        bigint id PK
        text client_txn_id UK
        text type
        bigint amount
        text description
        timestamptz created_at
    }

    savings_target {
        int id PK
        bigint amount
        timestamptz updated_at
    }

    users {
        uuid id PK
        varchar email
        jsonb raw_user_meta_data
        timestamptz created_at
    }

    rfid_cards ||--|| rfid_events : relasi
    rfid_events ||--|| suspicious_activities : memicu
```
