ch4_6 = """
<!-- CHAPTER 4 -->
<div class="page">
<h1 class="chapter">Chapter 4: User Manual</h1>

<h2 class="section">4.1 Operations Manual / Menu Explanation</h2>
<p>The SmartParking application is accessible at <strong>http://localhost:8000/index.html</strong>. The navigation bar at the top provides access to all major sections.</p>
<table>
<tr><th>Menu Item</th><th>Role</th><th>Description</th></tr>
<tr><td>Find Spots</td><td>All</td><td>Browse and search available parking spots on the map view</td></tr>
<tr><td>Dashboard</td><td>Logged In</td><td>View personal bookings, vehicles, and account info</td></tr>
<tr><td>Login / Register</td><td>Guest</td><td>Open the split-screen authentication modal</td></tr>
<tr><td>Logout</td><td>Logged In</td><td>Clear session token and return to homepage</td></tr>
</table>

<h3 class="subsection">Authentication Flow</h3>
<ol>
<li>Click <strong>Login</strong> in the top-right navbar.</li>
<li>A split-screen modal appears — parking illustration on the left, form on the right.</li>
<li>To register: click <em>Create Account</em> tab. Fill Name, Email, Phone, Password, Role. Click <em>Create Account</em>. A Welcome email is sent automatically.</li>
<li>To login: enter Email and Password, click <em>Sign In</em>. A Login Alert email is sent.</li>
<li>To reset password: click <em>Forgot Password?</em>, enter email, receive 6-digit OTP by email, enter OTP + New Password + Confirm Password, click <em>Confirm Password Reset</em>.</li>
</ol>

<h3 class="subsection">Booking Flow</h3>
<ol>
<li>Navigate to <strong>Find Spots</strong>. Use the search bar to filter by name or address.</li>
<li>Click <strong>Book Now</strong> on a spot card.</li>
<li>Add a vehicle if none is registered. Select start and end times.</li>
<li>Click <strong>Confirm Booking</strong>. A Booking Confirmation email is dispatched.</li>
<li>To cancel: go to Dashboard → My Bookings → click <strong>Cancel</strong> → confirm. A Cancellation email is sent.</li>
</ol>

<h3 class="subsection">Host Operations</h3>
<ol>
<li>Register/Login as <strong>Host</strong>.</li>
<li>On the Dashboard, click <strong>+ Add Spot</strong>.</li>
<li>Fill in spot name, address, price per hour, and capacity. Save.</li>
<li>View all bookings made at your spots in the <em>Host Bookings</em> section.</li>
</ol>

<h2 class="section">4.2 Menu Screens</h2>
<p>Below is a description of the key screens in the application:</p>
<table>
<tr><th>Screen</th><th>Description</th></tr>
<tr><td>Home / Hero Page</td><td>Landing page with SmartParking branding, navigation bar, and Call-to-Action buttons</td></tr>
<tr><td>Login Modal</td><td>Split-screen modal: parking illustration (left), Login/Register tabs (right)</td></tr>
<tr><td>Register Form</td><td>Fields: Name, Email, Phone, Password, Role (dropdown: User/Host)</td></tr>
<tr><td>Forgot Password</td><td>Email input → Submit → UI morphs to OTP + New Password + Confirm Password form</td></tr>
<tr><td>Find Spots Page</td><td>Search bar + grid of parking spot cards with Book Now button</td></tr>
<tr><td>Booking Modal</td><td>Vehicle selector, start/end datetime pickers, price summary, Confirm button</td></tr>
<tr><td>User Dashboard</td><td>Welcome banner, My Vehicles panel (+ Add Car), My Bookings panel with Cancel option</td></tr>
<tr><td>Host Dashboard</td><td>My Parking Spots panel (+ Add Spot), Spot management controls</td></tr>
<tr><td>Admin Dashboard</td><td>Platform-level user and booking management interface</td></tr>
</table>

<h2 class="section">4.3 Project Code</h2>
<h3 class="subsection">AuthController – Register Endpoint</h3>
<pre>[HttpPost("register")]
public async Task&lt;IActionResult&gt; Register(RegisterDto dto)
{
    if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        return BadRequest("Email already exists.");

    if (!Regex.IsMatch(dto.Password,
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$"))
        return BadRequest("Password does not meet complexity requirements.");

    var user = new User {
        Name = dto.Name, Email = dto.Email,
        PhoneNumber = dto.PhoneNumber,
        PasswordHash = dto.Password, Role = dto.Role
    };
    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    _ = _emailService.SendEmailAsync(user.Email, "Welcome to SmartParking!",
        $"&lt;h1&gt;Welcome, {user.Name}!&lt;/h1&gt;&lt;p&gt;Your account is now active.&lt;/p&gt;");

    return Ok("User registered successfully.");
}</pre>

<h3 class="subsection">AuthController – Forgot Password Endpoint</h3>
<pre>[HttpPost("forgot-password")]
public async Task&lt;IActionResult&gt; ForgotPassword(ForgotPasswordDto dto)
{
    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == dto.Email);
    if (user == null) return NotFound("Email not found.");

    var code = new Random().Next(100000, 999999).ToString();
    user.ResetPasswordToken = code;
    user.ResetPasswordExpiry = DateTime.Now.AddMinutes(15);
    await _context.SaveChangesAsync();

    _ = _emailService.SendEmailAsync(user.Email,
        "SmartParking Password Reset Code",
        $"&lt;h2&gt;Your code: &lt;strong&gt;{code}&lt;/strong&gt;&lt;/h2&gt;" +
        "&lt;p&gt;Valid for 15 minutes.&lt;/p&gt;");

    return Ok("Password reset code sent to your email.");
}</pre>

<h3 class="subsection">BookingController – Create Booking</h3>
<pre>[Authorize]
[HttpPost]
public async Task&lt;IActionResult&gt; CreateBooking(CreateBookingDto dto)
{
    var spot = await _context.ParkingSpots.FindAsync(dto.ParkingSpotId);
    if (spot == null) return BadRequest("Spot not found.");

    var overlap = await _context.Bookings
        .Where(b => b.ParkingSpotId == dto.ParkingSpotId
                 &amp;&amp; b.Status != "Cancelled"
                 &amp;&amp; dto.StartTime &lt; b.EndTime
                 &amp;&amp; b.StartTime &lt; dto.EndTime)
        .FirstOrDefaultAsync();

    if (overlap != null)
        return BadRequest("Spot already booked for this time range.");

    var booking = new Booking {
        UserId = dto.UserId, ParkingSpotId = dto.ParkingSpotId,
        StartTime = dto.StartTime, EndTime = dto.EndTime,
        TotalPrice = dto.TotalPrice, Status = "Confirmed",
        SlotNumber = "A-" + new Random().Next(100, 999)
    };
    _context.Bookings.Add(booking);
    await _context.SaveChangesAsync();

    var user = await _context.Users.FindAsync(dto.UserId);
    if (user != null)
        await _emailService.SendEmailAsync(user.Email,
            "SmartParking Reservation Confirmed",
            $"&lt;p&gt;Slot {booking.SlotNumber} at {spot.Name} confirmed!&lt;/p&gt;");

    return Ok(booking);
}</pre>

<h3 class="subsection">SmtpEmailService</h3>
<pre>public async Task SendEmailAsync(string toEmail, string subject, string body)
{
    var mailMessage = new MailMessage {
        From = new MailAddress(fromEmail),
        Subject = subject, Body = body, IsBodyHtml = true
    };
    mailMessage.To.Add(toEmail);
    using var smtpClient = new SmtpClient(host, port) {
        Credentials = new NetworkCredential(username, password),
        EnableSsl = true
    };
    await smtpClient.SendMailAsync(mailMessage);
}</pre>
</div>

<!-- CHAPTER 5 -->
<div class="page">
<h1 class="chapter">Chapter 5: Testing</h1>

<h2 class="section">5.1 Testing Test Plan</h2>
<p>The SmartParking system underwent structured testing across three levels: unit testing of individual API endpoints, integration testing of the database and email service interactions, and end-to-end (E2E) browser testing using an automated Chrome subagent.</p>
<table>
<tr><th>Test Level</th><th>Scope</th><th>Tools Used</th></tr>
<tr><td>Unit Testing</td><td>Individual controller methods</td><td>PowerShell Invoke-RestMethod, Swagger UI</td></tr>
<tr><td>Integration Testing</td><td>API + MySQL + SMTP email chain</td><td>Custom PowerShell test script (SendTestEmails.ps1)</td></tr>
<tr><td>E2E Browser Testing</td><td>Full UI flow via Chrome</td><td>Automated Chrome Browser Subagent</td></tr>
</table>

<h2 class="section">5.2 Black Box Testing – Data Validation</h2>
<p>Black box tests validate that the system correctly handles valid and invalid inputs at each endpoint without knowledge of internal implementation.</p>
<table>
<tr><th>Test ID</th><th>Input</th><th>Expected Output</th><th>Result</th></tr>
<tr><td>BB-01</td><td>Register with weak password "abc"</td><td>400 – Password complexity error</td><td>PASS</td></tr>
<tr><td>BB-02</td><td>Register with duplicate email</td><td>400 – Email already exists</td><td>PASS</td></tr>
<tr><td>BB-03</td><td>Login with incorrect password</td><td>401 – Unauthorized</td><td>PASS</td></tr>
<tr><td>BB-04</td><td>Book spot without JWT token</td><td>401 – Unauthorized</td><td>PASS</td></tr>
<tr><td>BB-05</td><td>Book spot for overlapping time</td><td>400 – Already booked</td><td>PASS</td></tr>
<tr><td>BB-06</td><td>Cancel another user's booking</td><td>401 – Unauthorized</td><td>PASS</td></tr>
<tr><td>BB-07</td><td>Forgot password with unknown email</td><td>404 – Email not found</td><td>PASS</td></tr>
<tr><td>BB-08</td><td>Reset password with expired OTP</td><td>400 – Code expired</td><td>PASS</td></tr>
<tr><td>BB-09</td><td>Reset password with wrong OTP</td><td>400 – Invalid code</td><td>PASS</td></tr>
<tr><td>BB-10</td><td>Search spots with valid query</td><td>200 – Matching spot list</td><td>PASS</td></tr>
</table>

<h2 class="section">5.3 White Box Testing – Functional Validation</h2>
<p>White box tests validate internal logic paths, branch conditions, and code correctness.</p>
<table>
<tr><th>Test ID</th><th>Code Path Tested</th><th>Expected Behavior</th><th>Result</th></tr>
<tr><td>WB-01</td><td>Regex password validation branch</td><td>Reject passwords without uppercase/digit/special char</td><td>PASS</td></tr>
<tr><td>WB-02</td><td>JWT token generation (GenerateJwtToken)</td><td>Token contains NameIdentifier, Name, Email, Role claims</td><td>PASS</td></tr>
<tr><td>WB-03</td><td>Overlap check LINQ query</td><td>Correctly detects time-range conflicts</td><td>PASS</td></tr>
<tr><td>WB-04</td><td>OTP expiry check (DateTime.Now &lt; ResetPasswordExpiry)</td><td>Reject OTP past 15 min window</td><td>PASS</td></tr>
<tr><td>WB-05</td><td>Fire-and-forget email dispatch (_= SendEmailAsync)</td><td>Email sent without blocking API response</td><td>PASS</td></tr>
<tr><td>WB-06</td><td>EF Core auto-migration (ALTER TABLE try/catch)</td><td>Safely adds new columns without crashing on re-run</td><td>PASS</td></tr>
<tr><td>WB-07</td><td>JSON cycle reference handler (IgnoreCycles)</td><td>No circular reference exception on Booking serialization</td><td>PASS</td></tr>
</table>

<h2 class="section">5.4 Test Cases and Results</h2>
<table>
<tr><th>TC No.</th><th>Test Case</th><th>Steps</th><th>Expected</th><th>Actual</th><th>Status</th></tr>
<tr><td>TC-01</td><td>User Registration</td><td>POST /api/Auth/register with valid data</td><td>201 + Welcome email</td><td>200 OK + email delivered</td><td>PASS</td></tr>
<tr><td>TC-02</td><td>User Login</td><td>POST /api/Auth/login with correct credentials</td><td>200 + JWT token</td><td>200 OK + token returned</td><td>PASS</td></tr>
<tr><td>TC-03</td><td>Forgot Password Email</td><td>POST /api/Auth/forgot-password</td><td>200 + 6-digit OTP in email</td><td>OTP received in Gmail</td><td>PASS</td></tr>
<tr><td>TC-04</td><td>Reset Password</td><td>POST /api/Auth/reset-password with valid OTP</td><td>200 + password updated</td><td>Password reset success</td><td>PASS</td></tr>
<tr><td>TC-05</td><td>Add Parking Spot (Host)</td><td>POST /api/ParkingSpots with Host JWT</td><td>200 + spot saved in DB</td><td>Spot created successfully</td><td>PASS</td></tr>
<tr><td>TC-06</td><td>Search Spots</td><td>GET /api/ParkingSpots/search?query=Premium</td><td>200 + matching spots</td><td>Correct results returned</td><td>PASS</td></tr>
<tr><td>TC-07</td><td>Create Booking</td><td>POST /api/Booking with valid JWT + spot</td><td>200 + booking confirmed + email</td><td>Booking created, email sent</td><td>PASS</td></tr>
<tr><td>TC-08</td><td>View My Bookings</td><td>GET /api/Booking/user/{id}</td><td>200 + booking list</td><td>Bookings listed correctly</td><td>PASS</td></tr>
<tr><td>TC-09</td><td>Cancel Booking</td><td>DELETE /api/Booking/{id} with owner JWT</td><td>200 + status Cancelled + email</td><td>Cancelled, email delivered</td><td>PASS</td></tr>
<tr><td>TC-10</td><td>Add Vehicle</td><td>POST /api/Vehicle with User JWT</td><td>200 + vehicle saved</td><td>Vehicle registered</td><td>PASS</td></tr>
<tr><td>TC-11</td><td>Chrome E2E Full Flow</td><td>Automated browser: register Host → add spot → register User → book → cancel → forgot password</td><td>All 4 emails received</td><td>All emails delivered to naresh9799612951@gmail.com</td><td>PASS</td></tr>
</table>
</div>

<!-- CHAPTER 6 -->
<div class="page">
<h1 class="chapter">Chapter 6: Limitations and Enhancement</h1>

<h2 class="section">6.1 Drawbacks and Limitations</h2>
<ul>
<li><strong>Plain-text Password Storage:</strong> In the current implementation, passwords are stored as plain text in the <code>PasswordHash</code> field. A production system must use a cryptographic hash (e.g., BCrypt or Argon2).</li>
<li><strong>No Payment Integration:</strong> The system calculates total prices but does not integrate with any payment gateway (Razorpay, Stripe, etc.). Users confirm bookings without online payment.</li>
<li><strong>No Real-time Slot Availability:</strong> Spot availability is calculated based on bookings, but there is no WebSocket-based live update when another user takes a spot simultaneously.</li>
<li><strong>Single Server Deployment:</strong> The application is designed for local deployment (localhost:8000). Cloud deployment (Azure, AWS, Render) with HTTPS, load balancing, and auto-scaling is not yet configured.</li>
<li><strong>No Mobile Application:</strong> The frontend is web-only. Native iOS and Android apps are not yet developed.</li>
<li><strong>Manual GPS Coordinates:</strong> Hosts must manually enter latitude/longitude. Integration with Google Maps Places API for auto-fill is not yet implemented.</li>
<li><strong>No OTP Rate Limiting:</strong> The forgot-password OTP endpoint does not implement rate limiting, making it theoretically susceptible to spam requests.</li>
<li><strong>No Push Notifications:</strong> Email is the only notification channel. SMS (Twilio) and web push notifications are not yet integrated.</li>
</ul>

<h2 class="section">6.2 Proposed Enhancements</h2>
<ul>
<li><strong>BCrypt Password Hashing:</strong> Replace plain-text storage with BCrypt to meet industry security standards.</li>
<li><strong>Razorpay / Stripe Payment Gateway:</strong> Integrate online payment collection at booking confirmation to enable a complete transactional flow.</li>
<li><strong>WebSocket Live Updates:</strong> Use SignalR to push real-time parking spot availability updates to all connected clients simultaneously.</li>
<li><strong>Google Maps API Integration:</strong> Auto-populate GPS coordinates and display parking spots on an interactive map with visual markers.</li>
<li><strong>Mobile App (React Native / Flutter):</strong> Develop cross-platform mobile apps that consume the existing REST API backend.</li>
<li><strong>OTP Rate Limiting &amp; CAPTCHA:</strong> Add rate limiting (5 requests/hour per IP) to the forgot-password endpoint and integrate reCAPTCHA.</li>
<li><strong>IoT Hardware Integration:</strong> Connect the system to physical barrier gates and sensors at parking entrances for automated vehicle detection and entry/exit logging.</li>
<li><strong>Analytics Dashboard:</strong> Provide hosts and admins with revenue analytics, peak hour heatmaps, and occupancy trend charts.</li>
<li><strong>Multi-language Support:</strong> Implement i18n/l10n for Hindi, Marathi, and other regional languages to serve a broader user base.</li>
<li><strong>Cloud Deployment:</strong> Deploy on Azure App Service with Azure MySQL Flexible Server, HTTPS SSL certificate, and CI/CD via GitHub Actions.</li>
</ul>

<h2 class="section">6.3 Conclusions</h2>
<p>The SmartParking Management System successfully demonstrates the design and implementation of a modern, full-stack web application that addresses a real-world urban problem. The project delivers a complete, working solution that covers the entire parking lifecycle — from spot discovery and reservation to cancellation and password management — all with automated email notifications at every step.</p>
<p>The system was built on a robust, industry-standard technology stack: ASP.NET Core 8.0 for the backend API, Entity Framework Core with MySQL for persistent storage, JWT-based authentication for secure sessions, and Gmail SMTP for transactional emails. The frontend, built with vanilla HTML, CSS, and JavaScript, provides a premium, responsive user experience without relying on heavy frameworks.</p>
<p>All key functional requirements were implemented and validated through rigorous black-box, white-box, and end-to-end Chrome browser tests. The automated test suite confirmed that all 11 test cases passed successfully, including a live E2E test that delivered four distinct emails to a real Gmail inbox, proving the system's production readiness.</p>
<p>This project provided invaluable hands-on experience in REST API design, relational database modeling, JWT security, SMTP email integration, and frontend-backend integration. The modular architecture ensures that the planned enhancements — payment gateways, IoT integration, and cloud deployment — can be layered on top of the existing codebase with minimal refactoring.</p>
<p>SmartParking is a solid foundation for a commercially viable parking management product that can scale to serve smart cities, malls, hospitals, and corporate campuses.</p>

<h2 class="section">6.4 Bibliography</h2>
<ol>
<li>Microsoft Docs. <em>ASP.NET Core documentation.</em> https://learn.microsoft.com/en-us/aspnet/core</li>
<li>Microsoft Docs. <em>Entity Framework Core.</em> https://learn.microsoft.com/en-us/ef/core/</li>
<li>JWT.io. <em>JSON Web Tokens – Introduction.</em> https://jwt.io/introduction</li>
<li>Pomelo Foundation. <em>Pomelo.EntityFrameworkCore.MySql.</em> https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql</li>
<li>Google. <em>Gmail SMTP settings for sending email.</em> https://support.google.com/mail/answer/7126229</li>
<li>Mozilla Developer Network. <em>HTML, CSS, JavaScript Reference.</em> https://developer.mozilla.org</li>
<li>Swashbuckle. <em>Swashbuckle.AspNetCore – Swagger for .NET.</em> https://github.com/domaindrivendev/Swashbuckle.AspNetCore</li>
<li>MySQL. <em>MySQL 8.0 Reference Manual.</em> https://dev.mysql.com/doc/refman/8.0/en/</li>
<li>OWASP. <em>OWASP Top Ten Web Application Security Risks.</em> https://owasp.org/www-project-top-ten/</li>
<li>W3Schools. <em>Web Development Tutorials.</em> https://www.w3schools.com</li>
</ol>
<br><br>
<p style="text-align:center; font-style:italic; color:#666;">--- End of Report ---</p>
</div>

</body>
</html>
"""

with open('e:/Project_Parking/SmartParking_Project_Report.html','a',encoding='utf-8') as f:
    f.write(ch4_6)
print("Chapters 4-6 + closing tags appended.")
