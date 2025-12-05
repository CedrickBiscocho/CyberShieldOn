-- Create threats table
CREATE TABLE public.threats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social', 'technical', 'network')),
  how_it_works JSONB NOT NULL DEFAULT '[]'::jsonb,
  warning_signs JSONB NOT NULL DEFAULT '[]'::jsonb,
  prevention JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id TEXT NOT NULL REFERENCES public.threats(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  threat_id TEXT NOT NULL REFERENCES public.threats(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  best_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, threat_id)
);

-- Enable RLS
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threats (public read)
CREATE POLICY "Anyone can view threats"
  ON public.threats FOR SELECT
  USING (true);

-- RLS Policies for quizzes (public read)
CREATE POLICY "Anyone can view quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_threats_updated_at
  BEFORE UPDATE ON public.threats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert threat data
INSERT INTO public.threats (id, name, icon, summary, description, category, how_it_works, warning_signs, prevention) VALUES
('phishing', 'Phishing Attacks', '🎣', 'Deceptive attempts to steal sensitive information through fake emails or websites.', 'Phishing is a cyberattack that uses disguised emails, messages, or websites to trick individuals into revealing sensitive information such as passwords, credit card numbers, or personal data.', 'social', 
'["Attacker sends fake emails that appear to be from legitimate sources (banks, companies, etc.)", "The email contains a malicious link or attachment", "Victim clicks the link and is directed to a fake website that looks real", "Victim enters sensitive information which is captured by the attacker", "Attacker uses the stolen information for identity theft or financial fraud"]'::jsonb,
'["Urgent or threatening language (\"Your account will be closed!\")", "Generic greetings like \"Dear Customer\" instead of your name", "Suspicious sender email addresses with slight misspellings", "Unexpected attachments or download requests", "Links that don''t match the claimed destination (hover to check)", "Poor grammar and spelling errors", "Requests for sensitive information via email"]'::jsonb,
'["Always verify sender email addresses carefully", "Never click links in suspicious emails - type URLs directly", "Enable two-factor authentication (2FA) on all accounts", "Use email filters and spam detection tools", "Hover over links before clicking to see the real URL", "Keep software and browsers updated", "Report phishing attempts to your IT department", "Verify requests through a different communication channel"]'::jsonb),

('malware', 'Malware Infections', '🦠', 'Malicious software designed to damage, disrupt, or gain unauthorized access to computer systems.', 'Malware (malicious software) includes viruses, trojans, ransomware, spyware, and other harmful programs that can steal data, encrypt files, or damage your system.', 'technical',
'["Malware enters through infected downloads, email attachments, or compromised websites", "Once installed, it may hide itself and run in the background", "Different types perform different actions: steal data, encrypt files, log keystrokes", "Some malware spreads to other devices on the network", "Attackers can remotely control infected systems or demand ransom"]'::jsonb,
'["Sudden slowdown in computer performance", "Unexpected pop-ups and advertisements", "Programs opening and closing automatically", "Files being deleted, modified, or encrypted", "Unusual network activity or data usage", "Antivirus software being disabled", "Browser homepage or search engine changed without permission", "Unknown programs in your startup list"]'::jsonb,
'["Install and regularly update antivirus software", "Only download software from official, trusted sources", "Keep operating system and all software updated", "Don''t open email attachments from unknown senders", "Use a firewall and enable it at all times", "Regular backup of important data to external drives", "Be cautious with USB drives and external media", "Use ad-blockers to prevent malicious advertisements", "Enable automatic security updates"]'::jsonb),

('mitm', 'Man-in-the-Middle (MITM) Attacks', '👤', 'Intercepting communications between two parties to eavesdrop or modify data.', 'MITM attacks occur when an attacker secretly intercepts and potentially alters the communication between two parties who believe they are directly communicating with each other.', 'network',
'["Attacker positions themselves between the victim and the target server", "All data passes through the attacker before reaching the destination", "Attacker can read, steal, or modify the data in transit", "Common on public WiFi networks or through compromised routers", "Victims are usually unaware that their connection is compromised"]'::jsonb,
'["Security certificate warnings in your browser", "Unusual redirects to different websites", "Slow or intermittent internet connection", "Unexpected logouts from secure websites", "Unusual activity in your online accounts", "HTTP instead of HTTPS in the address bar", "Pop-ups asking to accept security certificates"]'::jsonb,
'["Always use HTTPS websites (look for the padlock icon)", "Avoid using public WiFi for sensitive transactions", "Use a Virtual Private Network (VPN) on public networks", "Enable encryption on your home WiFi router", "Keep router firmware updated", "Use strong, unique passwords for WiFi networks", "Pay attention to browser security warnings", "Use end-to-end encrypted messaging apps", "Verify website certificates before entering sensitive data"]'::jsonb),

('ddos', 'DDoS Attacks', '⚡', 'Overwhelming a server or network with massive traffic to make services unavailable.', 'Distributed Denial of Service (DDoS) attacks flood a target with enormous amounts of traffic from multiple sources, making websites or services unavailable to legitimate users.', 'network',
'["Attackers compromise multiple computers to create a \"botnet\"", "All compromised devices are commanded to send requests to the target simultaneously", "The massive volume of traffic overwhelms the target server", "Legitimate users cannot access the service due to overload", "Attacks can last hours or days, causing significant disruption"]'::jsonb,
'["Website or service suddenly becomes very slow or unresponsive", "Unable to access a specific website while others work fine", "Unusual amount of spam or requests to your servers", "Odd patterns in website traffic analytics", "Increased network traffic from a single IP address or region", "Service intermittently available then unavailable", "Log files showing unusual activity patterns"]'::jsonb,
'["Use DDoS protection services and Content Delivery Networks (CDN)", "Implement rate limiting on your servers", "Configure firewalls to filter suspicious traffic", "Maintain excess bandwidth capacity", "Use load balancers to distribute traffic", "Keep infrastructure updated and patched", "Create an incident response plan", "Monitor network traffic for anomalies", "Use anti-DDoS hardware and software solutions", "Maintain backup servers and failover systems"]'::jsonb),

('weak-passwords', 'Weak Password Vulnerabilities', '🔐', 'Using easily guessable passwords that allow unauthorized access to accounts and systems.', 'Weak passwords are one of the most common security vulnerabilities. Attackers use various techniques like brute force, dictionary attacks, or credential stuffing to crack weak passwords and gain unauthorized access.', 'social',
'["Attackers use automated tools to try thousands of password combinations", "Common passwords, dictionary words, and personal information are tried first", "Leaked passwords from data breaches are tested across multiple sites", "Once a password is cracked, attackers access the account", "Compromised accounts can lead to identity theft, data breaches, or financial loss"]'::jsonb,
'["Unauthorized login attempts on your accounts", "Unexpected password reset emails you didn''t request", "Suspicious activity in your account history", "Friends receiving strange messages from your account", "Unable to log in with your usual password", "Account locked due to too many failed login attempts", "Notifications of logins from unfamiliar locations"]'::jsonb,
'["Create strong passwords with at least 12 characters", "Use a mix of uppercase, lowercase, numbers, and special characters", "Never reuse passwords across different accounts", "Use a password manager to generate and store complex passwords", "Enable two-factor authentication (2FA) everywhere possible", "Change passwords regularly, especially for sensitive accounts", "Avoid using personal information in passwords (names, birthdays)", "Don''t share passwords with anyone", "Use passphrases - longer combinations of random words", "Check if your passwords have been compromised using breach databases"]'::jsonb);

-- Insert quiz data
INSERT INTO public.quizzes (threat_id, questions) VALUES
('phishing', '[
  {"question": "What is the primary goal of a phishing attack?", "options": ["To slow down your computer", "To steal sensitive information like passwords", "To improve email security", "To send you advertisements"], "correctAnswer": 1},
  {"question": "Which of these is a common sign of a phishing email?", "options": ["Professional formatting and correct grammar", "Personalized greeting with your full name", "Urgent language and threats of account closure", "No links or attachments"], "correctAnswer": 2},
  {"question": "What should you do before clicking a link in an email?", "options": ["Click it immediately if it looks legitimate", "Hover over it to see the actual URL", "Forward the email to friends", "Delete your antivirus software"], "correctAnswer": 1},
  {"question": "Which security measure best protects against phishing?", "options": ["Using the same password for all accounts", "Clicking all links to test them", "Enabling two-factor authentication (2FA)", "Sharing passwords with trusted friends"], "correctAnswer": 2},
  {"question": "What makes a phishing email convincing?", "options": ["It contains obvious spelling mistakes", "It uses generic greetings like \"Dear User\"", "It appears to come from a trusted source", "It has no subject line"], "correctAnswer": 2}
]'::jsonb),

('malware', '[
  {"question": "What is malware?", "options": ["A type of computer hardware", "Malicious software designed to harm systems", "A legitimate antivirus program", "A computer performance booster"], "correctAnswer": 1},
  {"question": "Which is NOT a type of malware?", "options": ["Ransomware", "Trojan", "Firewall", "Spyware"], "correctAnswer": 2},
  {"question": "What is a common symptom of malware infection?", "options": ["Faster computer performance", "Unexpected pop-ups and slow performance", "Better internet connection", "Cleaner desktop appearance"], "correctAnswer": 1},
  {"question": "How can you best prevent malware infections?", "options": ["Download software from any website", "Disable your antivirus to improve speed", "Keep all software updated and use antivirus", "Open all email attachments"], "correctAnswer": 2},
  {"question": "What should you do if you suspect malware on your device?", "options": ["Ignore it and hope it goes away", "Run a full antivirus scan immediately", "Continue using the device normally", "Share the malware with friends"], "correctAnswer": 1}
]'::jsonb),

('mitm', '[
  {"question": "What does MITM stand for?", "options": ["Made In The Morning", "Man-in-the-Middle", "Malware In The Machine", "Multiple Internet Transfer Method"], "correctAnswer": 1},
  {"question": "Where are MITM attacks most common?", "options": ["On secure home networks", "On public WiFi networks", "On offline computers", "On printed documents"], "correctAnswer": 1},
  {"question": "What indicates a secure website connection?", "options": ["HTTP in the URL", "HTTPS and a padlock icon", "No icon at all", "A red warning symbol"], "correctAnswer": 1},
  {"question": "How can you protect against MITM attacks on public WiFi?", "options": ["Use public WiFi as much as possible", "Share your passwords publicly", "Use a VPN (Virtual Private Network)", "Disable all security settings"], "correctAnswer": 2},
  {"question": "What can an attacker do in a successful MITM attack?", "options": ["Improve your internet speed", "Intercept and steal your data", "Give you free WiFi", "Clean your computer"], "correctAnswer": 1}
]'::jsonb),

('ddos', '[
  {"question": "What does DDoS stand for?", "options": ["Digital Data Operating System", "Distributed Denial of Service", "Direct Download of Software", "Dangerous Device Online Service"], "correctAnswer": 1},
  {"question": "What is the main goal of a DDoS attack?", "options": ["To improve website performance", "To make services unavailable by overwhelming them", "To help users access websites faster", "To backup website data"], "correctAnswer": 1},
  {"question": "What is a \"botnet\" in the context of DDoS?", "options": ["A network of compromised devices used for attacks", "A legitimate security tool", "A type of antivirus software", "A fast internet connection"], "correctAnswer": 0},
  {"question": "Who is typically affected by a DDoS attack?", "options": ["Only the attacker", "Website owners and users trying to access services", "No one, it is harmless", "Only government agencies"], "correctAnswer": 1},
  {"question": "How can organizations protect against DDoS attacks?", "options": ["By ignoring all traffic", "By turning off their servers", "By using DDoS protection services and CDNs", "By removing all security measures"], "correctAnswer": 2}
]'::jsonb),

('weak-passwords', '[
  {"question": "Which is an example of a STRONG password?", "options": ["password123", "MyPet2024", "Tr0ub4dor&3#Xk9!", "admin"], "correctAnswer": 2},
  {"question": "What is the minimum recommended length for a secure password?", "options": ["4 characters", "8 characters", "12 characters or more", "20 characters"], "correctAnswer": 2},
  {"question": "Why should you never reuse passwords across accounts?", "options": ["It is easier to remember multiple passwords", "If one account is breached, all accounts are at risk", "Websites prefer unique passwords", "It makes accounts load faster"], "correctAnswer": 1},
  {"question": "What is two-factor authentication (2FA)?", "options": ["Using two weak passwords", "An extra security layer requiring a second verification method", "Logging in twice", "Sharing passwords with two people"], "correctAnswer": 1},
  {"question": "Which tool is best for managing multiple strong passwords?", "options": ["Writing them on sticky notes", "Using the same password everywhere", "A password manager application", "Telling them to friends"], "correctAnswer": 2}
]'::jsonb);