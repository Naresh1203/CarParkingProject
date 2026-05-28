import re

html_path = r'e:\Project_Parking\SmartParking_Project_Report.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

diagrams = [
    # 1: Context DFD
    r"""<div class="diagram-box">
      <strong>Level 0 DFD – Context Diagram</strong>
      <div class="mermaid">
      graph LR
        U[User] -->|Input| S(SmartParking System)
        H[Host] -->|Input| S
        A[Admin] -->|Input| S
        S -->|Output| E[Email Service]
        S -->|Data| DB[(MySQL Database)]
      </div>
      <span class="label">Fig 3.1 – Level 0 Context DFD</span>
    </div>""",
    
    # 2: FDD
    r"""<div class="diagram-box">
      <strong>Functional Decomposition Diagram</strong>
      <div class="mermaid">
      graph TD
        Root[SmartParking System]
        Root --> Auth[Authentication Module]
        Root --> Spot[Parking Spot Module]
        Root --> Book[Booking Module]
        Root --> Veh[Vehicle Module]
        Root --> Mail[Email Notification Module]

        Auth --> A1(Register) & A2(Login) & A3(Forgot Password)
        Spot --> S1(Add Spot) & S2(List Spots) & S3(Search Spots)
        Book --> B1(Create Booking) & B2(View Bookings) & B3(Cancel Booking)
        Veh --> V1(Add Vehicle) & V2(List Vehicles)
        Mail --> M1(Welcome) & M2(Login Alert) & M3(Booking Confirm)
      </div>
      <span class="label">Fig 3.2 – Functional Decomposition Diagram</span>
    </div>""",

    # 3: Class Diagram
    r"""<div class="diagram-box">
      <strong>Class Diagram</strong>
      <div class="mermaid">
      classDiagram
        class User {
          +Int Id
          +String Name
          +String Email
          +String Role
        }
        class ParkingSpot {
          +Int Id
          +String Name
          +Double Lat
          +Double Lon
          +Decimal Price
        }
        class Booking {
          +Int Id
          +Int UserId
          +Int ParkingSpotId
          +String Status
        }
        class Vehicle {
          +Int Id
          +String Model
          +String PlateNumber
        }

        User "1" -- "*" Booking : makes
        User "1" -- "*" Vehicle : owns
        ParkingSpot "1" -- "*" Booking : receives
        Vehicle "1" -- "*" Booking : used in
      </div>
      <span class="label">Fig 3.3.1 – Class Diagram</span>
    </div>""",

    # 4: Object Diagram
    r"""<div class="diagram-box">
      <strong>Object Diagram</strong>
      <div class="mermaid">
      classDiagram
        class `naresh : User` {
          Id = 5
          Name = "Naresh"
          Role = "User"
        }
        class `premiumSpot : ParkingSpot` {
          Id = 2
          Name = "Premium Spot"
          Price = 10
        }
        class `booking1 : Booking` {
          Id = 1
          UserId = 5
          SpotId = 2
          Status = "Confirmed"
        }
        `naresh : User` --> `booking1 : Booking`
        `booking1 : Booking` --> `premiumSpot : ParkingSpot`
      </div>
      <span class="label">Fig 3.3.2 – Object Diagram (Sample Instance)</span>
    </div>""",

    # 5: Use Case Diagram
    r"""<div class="diagram-box">
      <strong>Use Case Diagram</strong>
      <div class="mermaid">
      flowchart LR
        U((User))
        H((Host))
        A((Admin))
        
        subgraph SmartParking
          direction TB
          UC1(Register/Login)
          UC2(Search Spots)
          UC3(Book Spot)
          UC5(Manage Spot)
          UC6(View Host Bookings)
          UC8(View All Bookings)
        end

        U --> UC1
        U --> UC2
        U --> UC3
        H --> UC1
        H --> UC5
        H --> UC6
        A --> UC1
        A --> UC8
      </div>
      <span class="label">Fig 3.3.3 – Use Case Diagram</span>
    </div>""",

    # 6: Sequence Diagram
    r"""<div class="diagram-box">
      <strong>Sequence Diagram (Booking Flow)</strong>
      <div class="mermaid">
      sequenceDiagram
        actor User
        participant Frontend
        participant API as API Server
        participant DB as MySQL DB
        participant Email as SMTP Server

        User->>Frontend: Click "Book Now"
        Frontend->>API: POST /api/Booking
        API->>DB: Check overlapping bookings
        DB-->>API: No conflict
        API->>DB: INSERT Booking
        API->>Email: SendBookingConfirmation
        Email-->>User: Dispatch email
        API-->>Frontend: 200 OK
        Frontend-->>User: Show confirmation
      </div>
      <span class="label">Fig 3.3.4 – Booking Sequence Diagram</span>
    </div>""",

    # 7: Collaboration Diagram
    r"""<div class="diagram-box">
      <strong>Collaboration Diagram (Registration)</strong>
      <div class="mermaid">
      flowchart TD
        U((User)) -- 1: POST /register --> AC[AuthController]
        AC -- 2: Add --> DB[(AppDbContext)]
        AC -- 3: SendEmail --> ES[SmtpEmailService]
        ES -- 4: SMTP --> G[Gmail Server]
      </div>
      <span class="label">Fig 3.3.5 – Collaboration Diagram (Registration)</span>
    </div>""",

    # 8: State Diagram
    r"""<div class="diagram-box">
      <strong>State Diagram (Booking)</strong>
      <div class="mermaid">
      stateDiagram-v2
        [*] --> Pending : Selects time
        Pending --> Confirmed : Saves
        Confirmed --> Completed : Time elapsed
        Confirmed --> Cancelled : User cancels
        Cancelled --> [*]
        Completed --> [*]
      </div>
      <span class="label">Fig 3.3.6 – Booking State Diagram</span>
    </div>""",

    # 9: Activity Diagram
    r"""<div class="diagram-box">
      <strong>Activity Diagram (Login)</strong>
      <div class="mermaid">
      stateDiagram-v2
        [*] --> OpensApp
        OpensApp --> ClicksLogin
        ClicksLogin --> EntersCredentials
        EntersCredentials --> CheckValid
        state CheckValid <<choice>>
        CheckValid --> IssueJWT : Valid
        CheckValid --> ShowError : Invalid
        IssueJWT --> Dashboard
        ShowError --> EntersCredentials
        Dashboard --> [*]
      </div>
      <span class="label">Fig 3.3.7 – Login Activity Diagram</span>
    </div>""",

    # 10: Component Diagram
    r"""<div class="diagram-box">
      <strong>Component Diagram</strong>
      <div class="mermaid">
      flowchart TD
        W[SmartParking.Web HTML/JS] -- HTTP --> API[SmartParking.Server API]
        API -- EF Core --> DB[(MySQL Database)]
        API -- SMTP --> MAIL[Gmail Server]
        API -- Swagger --> DOCS[OpenAPI Docs]
      </div>
      <span class="label">Fig 3.3.8 – Component Diagram</span>
    </div>""",

    # 11: Deployment Diagram
    r"""<div class="diagram-box">
      <strong>Deployment Diagram</strong>
      <div class="mermaid">
      flowchart LR
        node1((Client Browser)) -- HTTP:8000 --> node2
        subgraph Application Server
          node2[ASP.NET Core 8.0]
        end
        subgraph Data Tier
          node3[(MySQL 8.0 Server)]
        end
        subgraph External Services
          node4[Gmail SMTP Server]
        end
        node2 --> node3
        node2 --> node4
      </div>
      <span class="label">Fig 3.3.9 – Deployment Diagram</span>
    </div>""",

    # 12: ERD
    r"""<div class="diagram-box">
      <strong>Entity Relationship Diagram</strong>
      <div class="mermaid">
      erDiagram
        USERS ||--o{ BOOKINGS : "makes"
        USERS ||--o{ VEHICLES : "owns"
        PARKING_SPOTS ||--o{ BOOKINGS : "receives"
        USERS ||--o{ PARKING_SPOTS : "hosts"
        VEHICLES ||--o{ BOOKINGS : "used in"

        USERS {
          int Id PK
          string Name
        }
        BOOKINGS {
          int Id PK
          int UserId FK
        }
        PARKING_SPOTS {
          int Id PK
          string Name
        }
      </div>
      <span class="label">Fig 3.4 – Entity Relationship Diagram</span>
    </div>"""
]

# Split by <div class="diagram-box"> ... </div>
parts = []
last_end = 0
matches = list(re.finditer(r'<div class="diagram-box">.*?</div>', content, flags=re.DOTALL))

for i, match in enumerate(matches):
    if i < len(diagrams):
        parts.append(content[last_end:match.start()])
        parts.append(diagrams[i])
        last_end = match.end()

parts.append(content[last_end:])

new_content = "".join(parts)

# Add mermaid script before </body>
if '<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>' not in new_content:
    script_tag = """
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
"""
    new_content = new_content.replace('</body>', script_tag)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced {len(matches)} diagrams with Mermaid implementations.")
