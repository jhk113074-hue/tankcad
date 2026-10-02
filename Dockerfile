FROM python:3.11-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies (curl, xvfb for headless ODA execution, Qt libraries, OpenGL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    xvfb \
    libopengl0 \
    libgl1 \
    libglx0 \
    libegl1 \
    libglu1-mesa \
    libqt5core5a \
    libqt5gui5 \
    libqt5widgets5 \
    libxcb-util1 \
    libxcb-cursor0 \
    libxkbcommon-x11-0 \
    && rm -rf /var/lib/apt/lists/*

# Fix libxcb-util symlink if needed on Debian/Ubuntu
RUN if [ -f /usr/lib/x86_64-linux-gnu/libxcb-util.so.1 ] && [ ! -f /usr/lib/x86_64-linux-gnu/libxcb-util.so.0 ]; then \
      ln -s /usr/lib/x86_64-linux-gnu/libxcb-util.so.1 /usr/lib/x86_64-linux-gnu/libxcb-util.so.0; \
    fi

# Download and install ODA File Converter for Linux (DEB)
RUN curl -s -L -H "Referer: https://www.opendesign.com/guestfiles/oda_file_converter" \
    "https://www.opendesign.com/guestfiles/get?filename=ODAFileConverter_QT6_lnxX64_11dll.deb" \
    -o /tmp/odafc.deb \
    && dpkg -i /tmp/odafc.deb || apt-get install -f -y \
    && rm -f /tmp/odafc.deb

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Build latest web bundle
RUN python build.py

# Expose default port (Render / Railway override with $PORT)
EXPOSE 8000

ENV DISPLAY=:99

# Start virtual display (xvfb) in background and start Python server
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 & python server.py"]
