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

    # 5: Use Case Diagram (UPDATED)
    r"""<div class="diagram-box">
      <strong>Use Case Diagram</strong>
      <div class="mermaid">
      flowchart LR
        U((User))
        O((Owner))
        A((Admin))

        subgraph SmartParking System
            direction TB
            UC1(Register)
            UC2(Login)
            UC3(Search Parking)
            UC4(Add Parking)
            UC5(View Booking Slot)
            UC6(Book Parking Slot)
            UC7(View Booking History)
            UC8(Manage User)
            UC9(Manage Host)
            UC10(Delete Parking)
        end

        U --> UC1
        U --> UC2
        U --> UC3
        U --> UC6
        U --> UC7

        O --> UC1
        O --> UC2
        O --> UC4
        O --> UC5
        O --> UC10

        A --> UC1
        A --> UC2
        A --> UC8
        A --> UC9
      </div>
      <span class="label">Fig 3.3.3 – Use Case Diagram</span>
    </div>""",

    # 6: Sequence Diagram (UPDATED)
    r"""<div class="diagram-box">
      <strong>Sequence Diagram (Booking Flow)</strong>
      <div class="mermaid">
      sequenceDiagram
        actor User
        participant System
        participant Owner
        participant ParkingSlot

        User->>System: Search parking
        System->>ParkingSlot: Check available slot
        ParkingSlot-->>System: Return slots
        User->>System: Booking slot
        System->>ParkingSlot: Saving slot
        System-->>User: Notification of slot booked
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

    # 9: Activity Diagrams (User + Owner) (UPDATED)
    r"""<div class="diagram-box">
      <strong>Activity Diagrams</strong>
      <div class="mermaid">
      stateDiagram-v2
        state "User Flow" as UserFlow {
            [*] --> U_RegisterLogin : Start
            U_RegisterLogin --> SearchParking
            SearchParking --> ViewAvailableSlots
            ViewAvailableSlots --> [*] : No (Logout)
            ViewAvailableSlots --> BookParkingSlot : Yes
            BookParkingSlot --> ConfirmBooking
            ConfirmBooking --> [*]
        }
        state "Owner Flow" as OwnerFlow {
            [*] --> O_RegisterLogin : Start
            O_RegisterLogin --> RegisterParkingLocation
            RegisterParkingLocation --> [*] : No (Logout)
            RegisterParkingLocation --> AddParkingSlots : Yes
            AddParkingSlots --> UpdateSlotAvailability
            UpdateSlotAvailability --> ViewBookingSlot
            ViewBookingSlot --> ViewEarning
            ViewBookingSlot --> MonitorBookings
            ViewEarning --> [*]
            MonitorBookings --> [*] : Continue
        }
      </div>
      <span class="label">Fig 3.3.7 – Activity Diagrams</span>
    </div>""",

    # 10: Component Diagram (UPDATED)
    r"""<div class="diagram-box">
      <strong>Component Diagram</strong>
      <div class="mermaid">
      flowchart TD
        WP[Web Portal<br>C#, ASP.NET]

        subgraph Modules
            UM[User Module<br>- Search Parking<br>- Confirm Parking]
            OM[Owner Module<br>- Add Slots<br>- Add Location<br>- View History]
            AM[Admin Module<br>- Manages System]
        end

        WP -- "uses" --> UM
        WP -- "uses" --> OM
        WP -- "uses" --> AM

        DB[(Database Layer<br>MySQL Database)]

        UM --> DB
        OM --> DB
        AM --> DB
      </div>
      <span class="label">Fig 3.3.8 – Component Diagram</span>
    </div>""",

    # 11: Deployment Diagram (UPDATED)
    r"""<div class="diagram-box">
      <strong>Deployment Diagram</strong>
      <div class="mermaid">
      flowchart TD
        subgraph ClientDevice [Client Device]
            direction TB
            B[Web Browser]
            U1[User: Vehicle Owner]
            U2[Admin]
            U3[Host / Owner]
        end

        subgraph WebServer [Web Server]
            direction TB
            WA[ASP.NET Web App]
            UI[User Interface]
        end

        subgraph AppServer [Application Server]
            direction TB
            C[C# API Services]
            Auth[Authentication]
            BP[Booking Parking]
            SA[Slot Availability]
        end

        subgraph DBServer [Database Server]
            DB[(MySQL Database)]
        end

        ClientDevice -- "HTTP/HTTPS" --> WebServer
        WebServer -- "API CALLS" --> AppServer
        AppServer -- "Database Connection" --> DBServer
      </div>
      <span class="label">Fig 3.3.9 – Deployment Diagram</span>
    </div>""",

    # 12: ERD (UPDATED)
    r"""<div class="diagram-box">
      <strong>Entity Relationship Diagram</strong>
      <div class="mermaid">
      erDiagram
        USER ||--o{ BOOKING : makes
        USER ||--o{ VEHICLE : owns
        USER ||--o{ NOTIFICATION : receives
        ADMIN ||--o{ USER : manages
        ADMIN ||--o{ BOOKING : verifies
        ADMIN ||--o{ PARKING_LOCATION : monitors
        OWNER ||--o{ PARKING_LOCATION : adds
        BOOKING ||--|| VEHICLE : tracks
        BOOKING ||--|| ENTRY_EXIT : has
        
        USER {
            int user_id PK
            string name
            string email
            string phone_no
        }
        ADMIN {
            int admin_id PK
            string name
            string email
            string password
        }
        OWNER {
            int owner_id PK
            string name
            string email
            string phone_no
        }
        VEHICLE {
            int vehicle_id PK
            int user_id FK
            string vehicle_no
        }
        BOOKING {
            int booking_id PK
            int user_id FK
            int vehicle_id FK
            string booking_status
        }
        PARKING_LOCATION {
            int slot_id PK
            string location
            string slot_number
            decimal price_per_hour
        }
        ENTRY_EXIT {
            int booking_id FK
            datetime entry_time
            datetime exit_time
        }
        NOTIFICATION {
            int id PK
            string message
        }
      </div>
      <span class="label">Fig 3.4 – Entity Relationship Diagram</span>
    </div>"""
]

# Find all 12 diagram-box elements
parts = []
last_end = 0
matches = list(re.finditer(r'<div class="diagram-box">.*?</div>', content, flags=re.DOTALL))

print(f"Found {len(matches)} diagram-box elements.")

for i, match in enumerate(matches):
    if i < len(diagrams):
        parts.append(content[last_end:match.start()])
        parts.append(diagrams[i])
        last_end = match.end()

parts.append(content[last_end:])

new_content = "".join(parts)

# Ensure mermaid script uses 'neutral' theme for simple black and white
old_script = "mermaid.initialize({ startOnLoad: true, theme: 'default' });"
new_script = "mermaid.initialize({ startOnLoad: true, theme: 'neutral' });"

if old_script in new_content:
    new_content = new_content.replace(old_script, new_script)
elif '<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>' not in new_content:
    # Just in case it's missing entirely
    script_tag = """
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
  </script>
</body>
"""
    new_content = new_content.replace('</body>', script_tag)
else:
    # Replace whatever theme is there with neutral
    new_content = re.sub(r'mermaid\.initialize\(\{.*?\}\);', new_script, new_content, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Restored and updated Mermaid diagrams successfully.")
