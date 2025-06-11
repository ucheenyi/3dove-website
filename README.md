Simple step

1.  docker run -d -p 80:80 -p 443:443   -v /path/to/ssl:/etc/nginx/ssl   ucheenyi/3dove-website:v1
2. docker exec into the container and add the cert and key ssl files in /etc/nginx/ssl
3. back up and edit the nginx config file:
 docker exec 4004d706783b cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
4. see default.conf file below:

 server {
    listen 80;
    server_name 3dove.cloud www.3dove.cloud;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name 3dove.cloud www.3dove.cloud;

    ssl_certificate /etc/nginx/ssl/domain.cert;
    ssl_certificate_key /etc/nginx/ssl/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

5. exit the container and reload the nginx


Great to hear that you’ve added the A record in **Porkbun** and it’s working, meaning your domain (e.g., `yourdomain.com`) now resolves to the Azure VM’s public IP (`13.93.136.206`). This should resolve the previous `curl: (60) SSL: no alternative certificate subject name matches target host name '13.93.136.206'` error when testing HTTPS, as you can now access the site via `https://yourdomain.com`, where the Porkbun SSL certificate should match. Building on our prior conversation, you’re deploying a static site in a Docker container (`yourusername/3dove-website:v1`) on an Azure VM, using Nginx with a Porkbun SSL certificate, and have fixed a `location` directive error in the Nginx configuration.

Below, I’ll provide a **complete and updated summary of steps** to ensure your static site is delivered over HTTPS, tailored to your current setup (with the A record added). I’ll also include the **complete Nginx configuration script** in an `<xaiArtifact>` tag, specifying the paths for the configuration and SSL certificate/key files. The steps will verify all components (DNS, Nginx, Docker, Azure) to ensure a smooth HTTPS delivery.

### Complete Steps to Ensure HTTPS Delivery

#### 1. Verify Porkbun A Record
Confirm the A record is correctly set and propagated.
- **Check DNS Settings**:
  - Log in to **https://porkbun.com/**, go to **DNS Management** for your domain.
  - Verify:
    - **Type**: A, **Host**: `@`, **Value**: `13.93.136.206`, **TTL**: `600` (or similar).
    - **Type**: A, **Host**: `www`, **Value**: `13.93.136.206`, **TTL**: `600` (if supporting `www.yourdomain.com`).
- **Test Resolution**:
  ```bash
  dig +short yourdomain.com A
  dig +short www.yourdomain.com A
  ```
  - Expect: `13.93.136.206` for both.
  - If incorrect, update in Porkbun and wait for propagation (typically fast, but up to 24 hours).
  - Check global propagation: **https://dnschecker.org/**.
- **Note**: Since you confirmed it’s working, this step is likely complete, but recheck if issues arise.

#### 2. Verify SSL Certificate Files
Ensure the Porkbun certificate and private key are correctly placed in the container.
- **Check Files**:
  ```bash
  docker exec 4004d706783b ls -l /etc/nginx/ssl/
  ```
  - Expect: `yourdomain.com.crt` (certificate, starts with `-----BEGIN CERTIFICATE-----`) and `yourdomain.com.key` (private key, starts with `-----BEGIN PRIVATE KEY-----`).
  - Verify contents:
    ```bash
    docker exec 4004d706783b head /etc/nginx/ssl/yourdomain.com.crt
    docker exec 4004d706783b head /etc/nginx/ssl/yourdomain.com.key
    ```
- **Handle CA Bundle** (if provided):
  If you have a `yourdomain.com.ca-bundle` file to complete the certificate chain:
  ```bash
  docker exec 4004d706783b cat /etc/nginx/ssl/yourdomain.com.crt /etc/nginx/ssl/yourdomain.com.ca-bundle > /etc/nginx/ssl/yourdomain.com.fullchain.crt
  ```
  Use `yourdomain.com.fullchain.crt` in the Nginx config (step 3).
- **Permissions**:
  ```bash
  docker exec 4004d706783b chmod 644 /etc/nginx/ssl/yourdomain.com.crt
  docker exec 4004d706783b chmod 600 /etc/nginx/ssl/yourdomain.com.key
  ```

#### 3. Apply Nginx Configuration
Update the Nginx configuration to serve the static site over HTTPS, using the Porkbun SSL certificate. The configuration below fixes the previous `location` directive error and ensures HTTP-to-HTTPS redirection.


server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt; # Public certificate
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key; # Private key

    # SSL settings for security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /usr/share/nginx/html; # Adjust to your static site path
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html; # Serve static files
    }
}


- **Paths**:
  - **Nginx Configuration Path**: `/etc/nginx/conf.d/default.conf` (inside the container).
  - **Certificate Path**: `/etc/nginx/ssl/yourdomain.com.crt` (or `/etc/nginx/ssl/yourdomain.com.fullchain.crt` if using CA bundle).
  - **Key Path**: `/etc/nginx/ssl/yourdomain.com.key`.
- **Apply Configuration**:
  - Backup existing config:
    ```bash
    docker exec 4004d706783b cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
    ```
  - Create the config on the host:
    ```bash
    nano ~/nginx.conf
    ```
    Paste the above, replacing `yourdomain.com` with your domain (e.g., `example.com` or `intelligenceafrica.com`). If using a CA bundle, update:
    ```nginx
    ssl_certificate /etc/nginx/ssl/yourdomain.com.fullchain.crt;
    ```
    Adjust `root` if your static site files are not in `/usr/share/nginx/html`.
  - Copy to container:
    ```bash
    docker cp ~/nginx.conf 4004d706783b:/etc/nginx/conf.d/default.conf
    ```
- **Validate**:
  ```bash
  docker exec 4004d706783b nginx -t
  ```
  Expect: `nginx: configuration file /etc/nginx/nginx.conf test is successful`.
- **Reload Nginx**:
  ```bash
  docker exec 4004d706783b nginx -s reload
  ```

#### 4. Verify Docker Container
Ensure the container is running with correct port mappings and SSL file mounts.
- **Check Container**:
  ```bash
  docker ps
  ```
  Confirm container `4004d706783b` (or `3dove-website`) has:
  ```
  PORTS: 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
  ```
- **Restart if Needed**:
  ```bash
  docker stop 4004d706783b
  docker rm 4004d706783b
  docker run -d \
    --name 3dove-website \
    -p 80:80 \
    -p 443:443 \
    -v /home/uche/ssl/yourdomain.com.crt:/etc/nginx/ssl/yourdomain.com.crt \
    -v /home/uche/ssl/yourdomain.com.key:/etc/nginx/ssl/yourdomain.com.key \
    yourusername/3dove-website:v1
  ```
  - Adjust `/home/uche/ssl/` to your host path.
  - Use `.fullchain.crt` if combined:
    ```bash
    -v /home/uche/ssl/yourdomain.com.fullchain.crt:/etc/nginx/ssl/yourdomain.com.fullchain.crt
    ```
- **Check Logs**:
  ```bash
  docker logs 4004d706783b
  docker exec 4004d706783b cat /var/log/nginx/error.log
  ```

#### 5. Verify Azure VM Networking
Ensure ports 80 and 443 are open.
- **Check NSG Rules**:
  - In the Azure Portal (**https://portal.azure.com**), go to **Virtual Machines > [Your VM] > Networking**.
  - Confirm inbound rules for TCP ports 80 and 443.
  - Add if missing:
    ```bash
    az network nsg rule create \
      --resource-group myResourceGroup \
      --nsg-name myNSG \
      --name AllowHTTP \
      --protocol Tcp \
      --priority 100 \
      --destination-port-range 80 \
      --access Allow
    az network nsg rule create \
      --resource-group myResourceGroup \
      --nsg-name myNSG \
      --name AllowHTTPS \
      --protocol Tcp \
      --priority 101 \
      --destination-port-range 443 \
      --access Allow
    ```
- **Verify Port 443**:
  ```bash
  sudo netstat -tuln | grep 443
  ```
  Expect: `tcp 0 0 0.0.0.0:443 0.0.0.0:* LISTEN`.

#### 6. Test HTTPS Delivery
- **Curl Test**:
  ```bash
  curl -I https://yourdomain.com
  ```
  Expect:
  ```
  HTTP/2 200
  server: nginx
  content-type: text/html
  ...
  ```
  Or a redirect for HTTP:
  ```bash
  curl -I http://yourdomain.com
  ```
  Expect:
  ```
  HTTP/1.1 301 Moved Permanently
  location: https://yourdomain.com/
  ...
  ```
- **Browser Test**:
  - Open `https://yourdomain.com`.
  - Expect a padlock icon and valid certificate for `yourdomain.com` or `www.yourdomain.com`.
- **Verify Certificate**:
  ```bash
  docker exec 4004d706783b openssl x509 -in /etc/nginx/ssl/yourdomain.com.crt -text -noout
  ```
  Check `Subject` and `Subject Alternative Name` for your domain.

#### 7. Monitor and Secure
- **Certificate Expiry**: Porkbun certificates last 1 year. Monitor via **https://porkbun.com/products/ssl** and renew as needed.
- **Security**:
  - Restrict NSG rules to specific IPs for production.
  - Ensure `.key` permissions:
    ```bash
    docker exec 4004d706783b chmod 600 /etc/nginx/ssl/yourdomain.com.key
    ```
  - Consider Azure Application Gateway for SSL offloading.
- **Backup**:
  ```bash
  docker cp 4004d706783b:/etc/nginx/conf.d/default.conf ~/nginx.conf.bak
  docker cp 4004d706783b:/etc/nginx/ssl/yourdomain.com.crt ~/yourdomain.com.crt.bak
  ```

### Paths
- **Nginx Configuration Path**: `/etc/nginx/conf.d/default.conf` (inside container).
- **Certificate Path**: `/etc/nginx/ssl/yourdomain.com.crt` (or `/etc/nginx/ssl/yourdomain.com.fullchain.crt` if CA bundle used).
- **Key Path**: `/etc/nginx/ssl/yourdomain.com.key`.
- **Host Paths** (example, adjust):
  - `/home/uche/ssl/yourdomain.com.crt`
  - `/home/uche/ssl/yourdomain.com.key`
  - `/home/uche/ssl/yourdomain.com.fullchain.crt` (if applicable)

### Notes
- **A Record Success**: The added A record resolves the IP-based testing issue. Always use `https://yourdomain.com` for HTTPS.
- **Porkbun SSL**: Ensure the certificate matches your domain:
  ```bash
  docker exec 4004d706783b openssl x509 -in /etc/nginx/ssl/yourdomain.com.crt -text -noout
  ```
- **Docker Image**: Assumed to be `yourusername/3dove-website:v1` with Nginx.
- **Azure VM**: Confirm `13.93.136.206` is static (**Networking > Public IP > Configuration > Assignment: Static**).
- **Context**: Possible domain `intelligenceafrica.com`. Ensure it matches the certificate and A record.
- **Time**: 10:13 PM WAT, June 10, 2025.

### Troubleshooting
- **HTTPS Fails**:
  - Check logs:
    ```bash
    docker exec 4004d706783b cat /var/log/nginx/error.log
    ```
  - Test:
    ```bash
    curl -I https://yourdomain.com
    ```
- **Certificate Issues**:
  - Verify domain match:
    ```bash
    docker exec 4004d706783b openssl x509 -in /etc/nginx/ssl/yourdomain.com.crt -text -noout
    ```
  - Use `.fullchain.crt` if chain incomplete.
- **Connection Issues**:
  - Check port 443:
    ```bash
    sudo netstat -tuln | grep 443
    ```
  - Verify NSG rules.

For help, provide:
- Your domain name.
- Output of `curl -I https://yourdomain.com`.
- Any browser errors.

See also:
- Porkbun DNS: **https://porkbun.com/support/DNS%20Records**
- Nginx SSL: **https://nginx.org/en/docs/http/configuring_https_servers.html**

Let me know if you encounter issues or need further tweaks!