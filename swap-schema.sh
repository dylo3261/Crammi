#!/opt/homebrew/bin/bash

# Directory containing blog post folders
BLOG_DIR="dist/blog"

declare -A SCHEMAS

SCHEMAS["5-study-techniques-that-actually-work"]='
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "5 Study Techniques That Actually Work",
        "description": "Discover five proven study techniques backed by science to help students retain information and prepare effectively for exams.",
        "image": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
        "author": {
          "@type": "Person",
          "name": "Jannet Riley"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Crammi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://crammi.com/crammipink.png"
          }
        },
        "datePublished": "2026-01-12T00:00:00Z",
        "dateModified": "2026-01-12T00:00:00Z",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://crammi.com/blog/5-study-techniques-that-actually-work"
        },
        "keywords": "study techniques, how to study, active recall, spaced repetition, exam study tips",
        "articleSection": "Study Tips"
      }'

SCHEMAS["ai-study-app-for-students-how-crammi-helps-you-study-better"]='
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Getting Started With an AI Study App for Students",
        "description": "Learn how AI powered learning tools like Crammi help students study smarter with personalized quizzes, exams, and flashcards.",
        "image": "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=800&q=80",
        "author": {
          "@type": "Person",
          "name": "Dylan Long"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Crammi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://crammi.com/crammipink.png"
          }
        },
        "datePublished": "2026-01-15T00:00:00Z",
        "dateModified": "2026-01-15T00:00:00Z",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://crammi.com/blog/ai-study-app-for-students-how-crammi-helps-you-study-better"
        },
        "keywords": "AI powered learning, Handwritten notes, AI study tools, Crammi, exam preparation, personalized learning",
        "articleSection": "Learning"
      }'

SCHEMAS["ai-study-tools-are-changing-education-technology"]='
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "AI Study Tools Are Changing Education",
        "description": "Explore the future of education technology including AI powered study tools, digital learning platforms, and personalized education.",
        "image": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80",
        "author": {
          "@type": "Person",
          "name": "Aria Hernandez"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Crammi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://crammi.com/crammipink.png"
          }
        },
        "datePublished": "2026-01-01T00:00:00Z",
        "dateModified": "2026-01-01T00:00:00Z",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://crammi.com/blog/ai-study-tools-are-changing-education-technology"
        },
        "keywords": "education technology, future of learning, AI in education, edtech, digital learning",
        "articleSection": "Technology"
      }'

SCHEMAS["ai-tools-and-productivity"]='
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Free AI Study Tools That Actually Boost Productivity",
        "description": "Discover how free AI study tools like Crammi boost student productivity with flashcards, quizzes, and practice exams.",
        "image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
        "author": {
          "@type": "Person",
          "name": "Tyler Leo"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Crammi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://crammi.com/crammipink.png"
          }
        },
        "datePublished": "2025-12-21T00:00:00Z",
        "dateModified": "2025-12-21T00:00:00Z",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://crammi.com/blog/ai-tools-and-productivity"
        },
        "keywords": "free AI study tools, AI productivity tools, study productivity, AI flashcards, Crammi, student productivity",
        "articleSection": "Productivity"
      }'

SCHEMAS["course-study-system"]='
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "How to Turn an Entire College Course into a Structured Study System",
        "description": "Take all the lecture note PDFs from your course and turn them into a structured study system with summaries, flashcards, quizzes, and cumulative exams - all in one place.",
        "image": "https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg",
        "author": {
          "@type": "Person",
          "name": "Dylan Long"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Crammi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://crammi.com/crammipink.png"
          }
        },
        "datePublished": "2025-02-01T00:00:00Z",
        "dateModified": "2025-02-01T00:00:00Z",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://crammi.com/blog/course-study-system"
        },
        "keywords": "Course Study System, AI study tool for college, Study tool for entire semester, Cumulative exam study tool, Crammi, Organize lecture slides, Semester-long study tool",
        "articleSection": "Productivity"
      }'

# Create a temporary Python script
cat > /tmp/update_blog_schema.py << 'PYTHON_SCRIPT'
import re
import sys

def update_html(file_path, new_schema):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        original_html = html
        
        # Remove WebSite schema if it exists
        website_pattern = r'<!-- Schema\.org markup -->\s*<script type="application/ld\+json">\s*\{\s*"@context"\s*:\s*"https://schema\.org"\s*,\s*"@type"\s*:\s*"WebSite"[^<]*\}\s*</script>\s*'
        html = re.sub(website_pattern, '', html, flags=re.DOTALL)
        
        # Also remove WebSite schema without comment
        website_pattern2 = r'<script type="application/ld\+json">\s*\{\s*"@context"\s*:\s*"https://schema\.org"\s*,\s*"@type"\s*:\s*"WebSite"[^<]*\}\s*</script>\s*'
        html = re.sub(website_pattern2, '', html, flags=re.DOTALL)
        
        # Check if BlogPosting already exists
        if '"BlogPosting"' in html or "'BlogPosting'" in html:
            # Remove existing BlogPosting (with or without comments and with any formatting)
            # Pattern 1: With <!-- Schema.org markup --> comment
            pattern1 = r'<!-- Schema\.org markup -->\s*<script type="application/ld\+json">[^<]*"@type"\s*:\s*"BlogPosting"[^<]*</script>\s*(?:<!-- Meta tags will be injected by vite-prerender-plugin during build -->\s*)?'
            html = re.sub(pattern1, '', html, flags=re.DOTALL)
            
            # Pattern 2: Without comment (catch any remaining BlogPosting schemas)
            pattern2 = r'<script type="application/ld\+json">[^<]*"@type"\s*:\s*"BlogPosting"[^<]*</script>\s*'
            html = re.sub(pattern2, '', html, flags=re.DOTALL)
        
        # Insert new BlogPosting schema after favicon
        pattern = r'(<link rel="icon" href="https://crammi\.com/favicon\.ico">)\s*'
        replacement = r'\1\n    \n    <script type="application/ld+json">' + new_schema + '\n    </script>\n    '
        html = re.sub(pattern, replacement, html)
        
        # Change og:type to article
        html = re.sub(
            r'<meta property="og:type" content="website"',
            '<meta property="og:type" content="article"',
            html
        )
        
        # Check if anything changed
        if html == original_html:
            print("WARNING: No changes made", file=sys.stderr)
            return False
        
        # Write the updated HTML
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        return True
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: update_blog_schema.py <file_path> <schema_json>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    schema_json = sys.argv[2]
    
    success = update_html(file_path, schema_json)
    sys.exit(0 if success else 1)
PYTHON_SCRIPT

for slug in "${!SCHEMAS[@]}"; do
  FILE="$BLOG_DIR/$slug/index.html"

  if [ ! -f "$FILE" ]; then
    echo "SKIP: $FILE not found"
    continue
  fi

  NEW_SCHEMA="${SCHEMAS[$slug]}"

  # Call the Python script with arguments
  python3 /tmp/update_blog_schema.py "$FILE" "$NEW_SCHEMA" 2>&1

  if [ $? -eq 0 ]; then
    echo "✓ $slug"
  else
    echo "✗ $slug"
  fi
done

# Cleanup
rm -f /tmp/update_blog_schema.py

echo ""
echo "Done! BlogPosting schemas updated."