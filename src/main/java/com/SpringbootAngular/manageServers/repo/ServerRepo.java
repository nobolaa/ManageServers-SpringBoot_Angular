package com.SpringbootAngular.manageServers.repo;

import com.SpringbootAngular.manageServers.model.Server;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerRepo extends JpaRepository<Server, Long> {
    Server findByIpAddress(String ipAddress);
}
