# Field Survey Documentation App - GitHub Setup

## Quick Setup for GitHub

### Option 1: Using GitHub Desktop (Recommended for Windows)

1. **Install GitHub Desktop** (if not already installed)
   - Download from: https://desktop.github.com/

2. **Add this repository:**
   - Open GitHub Desktop
   - File → Add Local Repository
   - Choose folder: `Z:\Private\scheney\documents\AUTOMATION\PS_INTAKE_V1`
   - If prompted to create a repository, click "Create a Repository"

3. **Connect to your GitHub repository:**
   - Repository → Repository Settings
   - In the "Primary remote repository" section, click "Remote"
   - Set remote URL to: `https://github.com/YOUR_USERNAME/ps-intake.git`
   - (Replace YOUR_USERNAME with your actual GitHub username)

4. **Commit and Push:**
   - Write a commit message (e.g., "Initial commit: PWA framework with GPS mapping")
   - Click "Commit to main"
   - Click "Push origin"

### Option 2: Using Git Command Line

If you prefer using Git CLI, first install Git from: https://git-scm.com/download/win

Then run these commands in PowerShell:

```powershell
cd Z:\Private\scheney\documents\AUTOMATION\PS_INTAKE_V1

# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PWA framework with GPS mapping"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ps-intake.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Hosting Options

### Option 1: GitHub Pages (Free & Easy)

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/ps-intake`
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Source", select **main** branch
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/ps-intake/`

**Note:** GitHub Pages uses HTTPS, which is required for the Geolocation API!

### Option 2: Netlify (Free with HTTPS)

1. Go to https://www.netlify.com/
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub and select your `ps-intake` repository
5. Click "Deploy site"
6. Your site will be live with a custom Netlify URL

### Option 3: Vercel (Free with HTTPS)

1. Go to https://vercel.com/
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import your `ps-intake` repository
5. Click "Deploy"
6. Your site will be live with a custom Vercel URL

## Testing on Mobile

Once hosted, you can:

1. **Open the URL on your phone's browser**
2. **Install as PWA:**
   - Chrome (Android): Menu → "Add to Home Screen"
   - Safari (iOS): Share → "Add to Home Screen"
3. **Grant location permissions** when prompted
4. **Test GPS tracking** by walking around outdoors

## Important Notes

- **HTTPS Required:** The Geolocation API requires HTTPS (or localhost for testing)
- **Location Permissions:** Users must grant location access for GPS to work
- **GPS Accuracy:** Works best outdoors with clear sky view
- **Offline Mode:** After first load, the app works offline thanks to the service worker

## Next Steps

After deploying, you can:
- Test the GPS functionality on your phone
- Add survey form fields
- Implement photo capture
- Add PDF/JPG export
- Integrate with Smartsheet API
