ch3 = """
<!-- CHAPTER 3 -->
<div class="page">
<h1 class="chapter">Chapter 3: Analysis &amp; Design</h1>

<h2 class="section">3.1 Data Flow Diagram (DFD)</h2>
<p>The DFD illustrates the flow of data between users, the SmartParking system, and the database. At Level 0, the system accepts inputs from three actors: User, Host, and Admin, and produces outputs such as booking confirmations, email alerts, and dashboard data.</p>
<div class="diagram-box">
<strong>Level 0 DFD – Context Diagram</strong><br><br>
[User] ──→ (SmartParking System) ──→ [Email Service]<br>
[Host] ──→ (SmartParking System) ──→ [MySQL Database]<br>
[Admin] ──→ (SmartParking System)<br>
<span class="label">Fig 3.1 – Level 0 Context DFD</span>
</div>
<p><strong>Level 1 DFD processes:</strong></p>
<ul>
<li>P1: User Authentication (Register / Login / Forgot Password)</li>
<li>P2: Parking Spot Management (Add / Update / Delete Spots)</li>
<li>P3: Booking Management (Create / View / Cancel Bookings)</li>
<li>P4: Vehicle Management (Add / View Vehicles)</li>
<li>P5: Email Notification Dispatch</li>
</ul>

<h2 class="section">3.2 Functional Decomposition Diagram (FDD)</h2>
<div class="diagram-box">
<strong>SmartParking System</strong><br><br>
├── Authentication Module<br>
│&nbsp;&nbsp;&nbsp;├── Register, Login, Forgot Password, Reset Password<br>
├── Parking Spot Module<br>
│&nbsp;&nbsp;&nbsp;├── Add Spot, List Spots, Search Spots, Update, Delete<br>
├── Booking Module<br>
│&nbsp;&nbsp;&nbsp;├── Create Booking, View Bookings, Cancel Booking<br>
├── Vehicle Module<br>
│&nbsp;&nbsp;&nbsp;├── Add Vehicle, List Vehicles<br>
└── Email Notification Module<br>
&nbsp;&nbsp;&nbsp;&nbsp;├── Welcome, Login Alert, Booking Confirm, Cancel, Reset<br>
<span class="label">Fig 3.2 – Functional Decomposition Diagram</span>
</div>

<h2 class="section">3.3 UML Diagrams</h2>

<h3 class="subsection">3.3.1 Class Diagram</h3>
<p>The class diagram shows the four core domain models and their relationships.</p>
<div class="diagram-box">
<strong>Class Diagram</strong><br><br>
User [Id, Name, Email, Phone, PasswordHash, Role, ResetToken, ResetExpiry]<br>
&nbsp;&nbsp;1 ──────── * Booking [Id, UserId, ParkingSpotId, VehicleId, StartTime, EndTime, TotalPrice, Status, SlotNumber]<br>
&nbsp;&nbsp;1 ──────── * Vehicle [Id, UserId, Model, Color, PlateNumber]<br>
ParkingSpot [Id, Name, Address, Lat, Lon, PricePerHour, Capacity, HostId]<br>
&nbsp;&nbsp;1 ──────── * Booking<br>
<span class="label">Fig 3.3.1 – Class Diagram</span>
</div>

<h3 class="subsection">3.3.2 Object Diagram</h3>
<div class="diagram-box">
naresh: User [Id=5, Name="Naresh", Role="User"]<br>
premiumSpot: ParkingSpot [Id=2, Name="Premium Spot", Price=10]<br>
booking1: Booking [Id=1, UserId=5, SpotId=2, Status="Confirmed"]<br>
<span class="label">Fig 3.3.2 – Object Diagram (Sample Instance)</span>
</div>

<h3 class="subsection">3.3.3 Use Case Diagram</h3>
<div class="diagram-box">
<strong>Actors: User | Host | Admin</strong><br><br>
User: Register, Login, ForgotPassword, SearchSpots, BookSpot, CancelBooking, AddVehicle<br>
Host: Login, AddSpot, UpdateSpot, DeleteSpot, ViewHostBookings<br>
Admin: Login, ManageUsers, ViewAllBookings<br>
<span class="label">Fig 3.3.3 – Use Case Diagram</span>
</div>

<h3 class="subsection">3.3.4 Sequence Diagram</h3>
<p><strong>Booking Flow Sequence:</strong></p>
<div class="diagram-box">
User → Frontend: Click "Book Now"<br>
Frontend → API [POST /api/Booking]: {userId, spotId, startTime, endTime}<br>
API → DB: Check overlapping bookings<br>
DB → API: No conflict<br>
API → DB: INSERT Booking (Status=Confirmed)<br>
API → EmailService: SendBookingConfirmation<br>
EmailService → Gmail SMTP: Dispatch email<br>
API → Frontend: 200 OK + booking object<br>
Frontend → User: Show confirmation<br>
<span class="label">Fig 3.3.4 – Booking Sequence Diagram</span>
</div>

<h3 class="subsection">3.3.5 Collaboration Diagram</h3>
<div class="diagram-box">
[User] ─1:POST /register→ [AuthController] ─2:Add→ [AppDbContext]<br>
[AuthController] ─3:SendEmail→ [SmtpEmailService] ─4:SMTP→ [Gmail]<br>
<span class="label">Fig 3.3.5 – Collaboration Diagram (Registration)</span>
</div>

<h3 class="subsection">3.3.6 State Diagram</h3>
<div class="diagram-box">
<strong>Booking State Machine</strong><br><br>
[Start] ──→ (Pending) ──→ (Confirmed) ──→ (Completed)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Cancelled)<br>
<span class="label">Fig 3.3.6 – Booking State Diagram</span>
</div>

<h3 class="subsection">3.3.7 Activity Diagram</h3>
<div class="diagram-box">
[Start] → User opens app → Clicks Login → Enters credentials<br>
→ [Valid?] Yes → JWT issued → Dashboard shown → [End]<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;No → Show error → Retry<br>
<span class="label">Fig 3.3.7 – Login Activity Diagram</span>
</div>

<h3 class="subsection">3.3.8 Component Diagram</h3>
<div class="diagram-box">
[SmartParking.Web] ──HTTP──→ [SmartParking.Server API]<br>
[SmartParking.Server API] ──EF Core──→ [MySQL Database]<br>
[SmartParking.Server API] ──SMTP──→ [Gmail Email Server]<br>
[SmartParking.Server API] ──Swagger──→ [OpenAPI Docs]<br>
<span class="label">Fig 3.3.8 – Component Diagram</span>
</div>

<h3 class="subsection">3.3.9 Deployment Diagram</h3>
<div class="diagram-box">
[Client Browser] ──HTTP:8000──→ [Application Server: localhost:8000]<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ASP.NET Core 8.0 + wwwroot static files]<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;──MySQL:3306──→ [MySQL 8.0 Server]<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;──SMTP:587──→ [Gmail SMTP Server]<br>
<span class="label">Fig 3.3.9 – Deployment Diagram</span>
</div>
</div>

<div class="page">
<h2 class="section">3.4 Entity Relationship Diagram (ERD)</h2>
<div class="diagram-box">
USERS ──(1:M)── BOOKINGS ──(M:1)── PARKING_SPOTS<br>
USERS ──(1:M)── VEHICLES<br>
BOOKINGS ──(M:1)── VEHICLES<br>
PARKING_SPOTS ──(M:1)── USERS [as Host]<br>
<span class="label">Fig 3.4 – Entity Relationship Diagram</span>
</div>

<h2 class="section">3.5 Data Dictionary</h2>
<table>
<tr><th>Table</th><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>Users</td><td>Id</td><td>INT PK</td><td>Auto-increment primary key</td></tr>
<tr><td>Users</td><td>Name</td><td>LONGTEXT</td><td>Full name of user</td></tr>
<tr><td>Users</td><td>Email</td><td>LONGTEXT</td><td>Unique email address</td></tr>
<tr><td>Users</td><td>PhoneNumber</td><td>LONGTEXT</td><td>Contact number</td></tr>
<tr><td>Users</td><td>PasswordHash</td><td>LONGTEXT</td><td>Password (plaintext in demo; hash in production)</td></tr>
<tr><td>Users</td><td>Role</td><td>LONGTEXT</td><td>User | Host | Admin</td></tr>
<tr><td>Users</td><td>ResetPasswordToken</td><td>LONGTEXT NULL</td><td>6-digit OTP for password reset</td></tr>
<tr><td>Users</td><td>ResetPasswordExpiry</td><td>DATETIME NULL</td><td>OTP expiry (15 min from generation)</td></tr>
<tr><td>ParkingSpots</td><td>Id</td><td>INT PK</td><td>Auto-increment primary key</td></tr>
<tr><td>ParkingSpots</td><td>Name</td><td>LONGTEXT</td><td>Name of the parking location</td></tr>
<tr><td>ParkingSpots</td><td>Address</td><td>LONGTEXT</td><td>Physical address</td></tr>
<tr><td>ParkingSpots</td><td>Latitude</td><td>DOUBLE</td><td>GPS latitude</td></tr>
<tr><td>ParkingSpots</td><td>Longitude</td><td>DOUBLE</td><td>GPS longitude</td></tr>
<tr><td>ParkingSpots</td><td>PricePerHour</td><td>DECIMAL(18,2)</td><td>Hourly rate in INR</td></tr>
<tr><td>ParkingSpots</td><td>TotalCapacity</td><td>INT</td><td>Total number of parking slots</td></tr>
<tr><td>ParkingSpots</td><td>AvailableSpots</td><td>INT</td><td>Currently available slots</td></tr>
<tr><td>ParkingSpots</td><td>HostId</td><td>INT FK</td><td>References Users.Id (Host)</td></tr>
<tr><td>Bookings</td><td>Id</td><td>INT PK</td><td>Auto-increment primary key</td></tr>
<tr><td>Bookings</td><td>UserId</td><td>INT FK</td><td>References Users.Id</td></tr>
<tr><td>Bookings</td><td>ParkingSpotId</td><td>INT FK</td><td>References ParkingSpots.Id</td></tr>
<tr><td>Bookings</td><td>VehicleId</td><td>INT FK NULL</td><td>References Vehicles.Id</td></tr>
<tr><td>Bookings</td><td>StartTime</td><td>DATETIME</td><td>Booking start date/time</td></tr>
<tr><td>Bookings</td><td>EndTime</td><td>DATETIME</td><td>Booking end date/time</td></tr>
<tr><td>Bookings</td><td>TotalPrice</td><td>DECIMAL(18,2)</td><td>Calculated total cost</td></tr>
<tr><td>Bookings</td><td>Status</td><td>LONGTEXT</td><td>Pending | Confirmed | Completed | Cancelled</td></tr>
<tr><td>Bookings</td><td>SlotNumber</td><td>LONGTEXT NULL</td><td>Auto-assigned slot (e.g. A-123)</td></tr>
<tr><td>Vehicles</td><td>Id</td><td>INT PK</td><td>Auto-increment primary key</td></tr>
<tr><td>Vehicles</td><td>UserId</td><td>INT FK</td><td>References Users.Id</td></tr>
<tr><td>Vehicles</td><td>Model</td><td>LONGTEXT</td><td>Vehicle model name</td></tr>
<tr><td>Vehicles</td><td>Color</td><td>LONGTEXT</td><td>Vehicle color</td></tr>
<tr><td>Vehicles</td><td>PlateNumber</td><td>LONGTEXT</td><td>Registration plate number</td></tr>
</table>

<h2 class="section">3.6 Table Design</h2>
<p class="table-caption">Table 3.6.1 – Users Table</p>
<table>
<tr><th>Column</th><th>Type</th><th>Constraints</th></tr>
<tr><td>Id</td><td>INT</td><td>PRIMARY KEY, AUTO_INCREMENT</td></tr>
<tr><td>Name</td><td>LONGTEXT</td><td>NOT NULL</td></tr>
<tr><td>Email</td><td>LONGTEXT</td><td>NOT NULL, UNIQUE</td></tr>
<tr><td>PhoneNumber</td><td>LONGTEXT</td><td>NOT NULL</td></tr>
<tr><td>PasswordHash</td><td>LONGTEXT</td><td>NOT NULL</td></tr>
<tr><td>Role</td><td>LONGTEXT</td><td>DEFAULT 'User'</td></tr>
<tr><td>ResetPasswordToken</td><td>LONGTEXT</td><td>NULL</td></tr>
<tr><td>ResetPasswordExpiry</td><td>DATETIME(6)</td><td>NULL</td></tr>
</table>

<p class="table-caption">Table 3.6.2 – Bookings Table</p>
<table>
<tr><th>Column</th><th>Type</th><th>Constraints</th></tr>
<tr><td>Id</td><td>INT</td><td>PRIMARY KEY, AUTO_INCREMENT</td></tr>
<tr><td>UserId</td><td>INT</td><td>FK → Users.Id</td></tr>
<tr><td>ParkingSpotId</td><td>INT</td><td>FK → ParkingSpots.Id</td></tr>
<tr><td>VehicleId</td><td>INT</td><td>FK → Vehicles.Id, NULL</td></tr>
<tr><td>StartTime</td><td>DATETIME(6)</td><td>NOT NULL</td></tr>
<tr><td>EndTime</td><td>DATETIME(6)</td><td>NOT NULL</td></tr>
<tr><td>TotalPrice</td><td>DECIMAL(18,2)</td><td>NOT NULL</td></tr>
<tr><td>Status</td><td>LONGTEXT</td><td>DEFAULT 'Pending'</td></tr>
<tr><td>SlotNumber</td><td>LONGTEXT</td><td>NULL</td></tr>
</table>

<h2 class="section">3.7 Code Design</h2>
<p>The project is organized using a layered architecture. The <strong>Models</strong> layer defines entity classes mapped to MySQL tables. The <strong>Data</strong> layer contains <code>AppDbContext</code> which manages EF Core operations. The <strong>Controllers</strong> layer handles HTTP requests and business logic. The <strong>Services</strong> layer contains the <code>IEmailService</code> abstraction and <code>SmtpEmailService</code> implementation. The <strong>DTOs</strong> layer provides request/response shape contracts separate from domain models.</p>
<pre>SmartParking.Server/
├── Controllers/
│   ├── AuthController.cs       # Register, Login, ForgotPassword, ResetPassword
│   ├── BookingController.cs    # CreateBooking, CancelBooking, GetUserBookings
│   ├── ParkingController.cs    # CRUD for ParkingSpots
│   ├── VehicleController.cs    # Add/List Vehicles
│   └── AdminController.cs      # Admin operations
├── Models/
│   ├── User.cs, Booking.cs, ParkingSpot.cs, Vehicle.cs
├── Data/
│   └── AppDbContext.cs         # EF Core DbContext
├── Services/
│   ├── IEmailService.cs
│   └── SmtpEmailService.cs     # Gmail SMTP implementation
├── Dtos/
│   └── AuthDtos.cs, BookingDtos.cs, ParkingDtos.cs ...
└── Program.cs                  # DI, Middleware, JWT, Swagger config</pre>
</div>
"""

with open('e:/Project_Parking/SmartParking_Project_Report.html','a',encoding='utf-8') as f:
    f.write(ch3)
print("Chapter 3 appended.")
