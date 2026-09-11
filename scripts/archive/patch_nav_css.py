import re

with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    css = f.read()

# The original block:
old_nav_css = """.nav-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-link:hover, .nav-link.active {
  color: var(--color-accent);
  background-color: var(--color-surface-2);
}"""

new_nav_css = """.nav-links li {
  position: relative;
}

.nav-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
  transition: color 0.2s ease;
  text-decoration: none;
}

/* Base style for desktop top/bottom borders */
@media (min-width: 769px) {
  .nav-link::before,
  .nav-link::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    background-color: var(--color-accent);
    transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .nav-link::before {
    top: 0;
    left: 0;
  }

  .nav-link::after {
    bottom: 0;
    right: 0;
  }

  /* Hover & Active triggers */
  .nav-link:hover,
  .nav-dropdown:hover > .nav-link {
    color: var(--color-accent);
  }

  .nav-link:hover::before,
  .nav-dropdown:hover > .nav-link::before,
  .nav-link:hover::after,
  .nav-dropdown:hover > .nav-link::after {
    width: 100%;
  }

  /* Highlight active nav item based on data-page */
  body[data-page="home"] .nav-link[data-nav="home"],
  body[data-page="browse"] .nav-link[data-nav="browse"],
  body[data-page="detail"] .nav-link[data-nav="browse"],
  body[data-page="knowledge"] .nav-link[data-nav="knowledge"],
  body[data-page="handwriting-guide"] .nav-link[data-nav="knowledge"],
  body[data-page="special-readings"] .nav-link[data-nav="knowledge"],
  body[data-page="games"] .nav-link[data-nav="games"],
  body[data-page="about"] .nav-link[data-nav="about"] {
    color: var(--color-accent);
  }

  body[data-page="home"] .nav-link[data-nav="home"]::before,
  body[data-page="browse"] .nav-link[data-nav="browse"]::before,
  body[data-page="detail"] .nav-link[data-nav="browse"]::before,
  body[data-page="knowledge"] .nav-link[data-nav="knowledge"]::before,
  body[data-page="handwriting-guide"] .nav-link[data-nav="knowledge"]::before,
  body[data-page="special-readings"] .nav-link[data-nav="knowledge"]::before,
  body[data-page="games"] .nav-link[data-nav="games"]::before,
  body[data-page="about"] .nav-link[data-nav="about"]::before,
  body[data-page="home"] .nav-link[data-nav="home"]::after,
  body[data-page="browse"] .nav-link[data-nav="browse"]::after,
  body[data-page="detail"] .nav-link[data-nav="browse"]::after,
  body[data-page="knowledge"] .nav-link[data-nav="knowledge"]::after,
  body[data-page="handwriting-guide"] .nav-link[data-nav="knowledge"]::after,
  body[data-page="special-readings"] .nav-link[data-nav="knowledge"]::after,
  body[data-page="games"] .nav-link[data-nav="games"]::after,
  body[data-page="about"] .nav-link[data-nav="about"]::after {
    width: 100%;
  }
}

/* Dropdown Menu - Desktop */
@media (min-width: 769px) {
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 240px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-top: 2px solid var(--color-accent);
    box-shadow: var(--shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    list-style: none;
    padding: 0;
    z-index: 100;
  }

  .nav-dropdown:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .dropdown-menu li {
    margin: 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .dropdown-menu li:last-child {
    border-bottom: none;
  }

  .dropdown-menu a {
    display: block;
    padding: 14px 18px;
    color: var(--color-text);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: 500;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  /* Dropdown Wiping Animation (Backrooms style) */
  .dropdown-menu a::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-surface-hover);
    z-index: -1;
    transform: translateX(-101%);
    transition: transform 0.35s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .dropdown-menu a:hover {
    color: var(--color-accent);
  }
  
  .dropdown-menu a:hover::before {
    transform: translateX(0);
  }

  .dropdown-menu a.disabled {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }
}"""

# For mobile adjustments, append at the end of the file or find the mobile media query.
mobile_adjustments = """
/* Mobile Nav Adjustments */
@media (max-width: 768px) {
  .dropdown-menu {
    list-style: none;
    padding-left: var(--spacing-lg);
    margin-top: var(--spacing-xs);
    border-left: 2px solid var(--color-border-subtle);
  }
  .dropdown-menu a {
    display: block;
    padding: 10px 12px;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--font-size-sm);
  }
  .dropdown-menu a:hover {
    color: var(--color-accent);
  }
  .dropdown-menu a.disabled {
    opacity: 0.5;
  }
  
  .nav-link:hover,
  body[data-page="home"] .nav-link[data-nav="home"],
  body[data-page="browse"] .nav-link[data-nav="browse"],
  body[data-page="detail"] .nav-link[data-nav="browse"],
  body[data-page="knowledge"] .nav-link[data-nav="knowledge"],
  body[data-page="handwriting-guide"] .nav-link[data-nav="knowledge"],
  body[data-page="special-readings"] .nav-link[data-nav="knowledge"],
  body[data-page="games"] .nav-link[data-nav="games"],
  body[data-page="about"] .nav-link[data-nav="about"] {
    color: var(--color-accent);
    background-color: var(--color-surface-2);
    border-radius: var(--border-radius-sm);
  }
}
"""

if old_nav_css in css:
    css = css.replace(old_nav_css, new_nav_css)
    css += mobile_adjustments
    with open('assets/css/components.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("CSS patched successfully.")
else:
    print("Could not find the target CSS block.")

