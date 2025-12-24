# gRPC Implementation for EarningsApp

## Overview
This document describes the complete gRPC implementation that replaces REST communication between microservices in the EarningsApp.

## Architecture Changes

### Before (REST)
```
Frontend → Gateway → Auth Service (HTTP)
Frontend → Gateway → Admin Service (HTTP)
```

### After (gRPC)
```
Frontend → Gateway → Auth Service (gRPC)
Frontend → Gateway → Admin Service (gRPC)
```

## Implementation Details

### 1. Protocol Buffer Definitions

#### Auth Service (`backend/proto/auth.proto`)
- **Services**: Signup, Login, Refresh, Verify, Forgot, Reset, GetUser
- **Messages**: User, SignupRequest/Response, LoginRequest/Response, etc.
- **Port**: 50051

#### Admin Service (`backend/proto/admin.proto`)
- **Services**: User management (GetUsers, PromoteUser, DemoteUser, SetUserRole, GetLoginActivity)
- **Services**: Stock management (GetStocks, AddStock, UpdateStock, DeleteStock, BulkUploadStocks, etc.)
- **Messages**: User, Stock, LoginActivity, PaginationInfo, etc.
- **Port**: 50052

### 2. Service Updates

#### Auth Service (`backend/authservice2/`)
- **Main**: Updated to run both HTTP (port 3001) and gRPC (port 50051) servers
- **Controller**: Added `AuthGrpcController` with gRPC method decorators
- **Module**: Updated to include gRPC controller
- **Dependencies**: Added `@nestjs/microservices`, `@grpc/grpc-js`, `@grpc/proto-loader`

#### Admin Service (`backend/adminservice/`)
- **Main**: Updated to run both HTTP (port 3002) and gRPC (port 50052) servers
- **Controller**: Added `AdminGrpcController` with comprehensive gRPC methods
- **Module**: Updated to include gRPC controller
- **Dependencies**: Added `@nestjs/microservices`, `@grpc/grpc-js`, `@grpc/proto-loader`

#### Gateway (`backend/gateway/`)
- **Clients**: Created `AuthGrpcClient` and `AdminGrpcClient` for gRPC communication
- **Service**: Updated `GatewayService` to use gRPC clients instead of HTTP calls
- **Module**: Updated to include gRPC clients
- **Dependencies**: Added `@nestjs/microservices`, `@grpc/grpc-js`, `@grpc/proto-loader`

### 3. Docker Configuration

#### Port Exposures
- **Auth Service**: HTTP (3001), gRPC (50051)
- **Admin Service**: HTTP (3002), gRPC (50052)
- **Gateway**: HTTP (3000)

#### Dockerfile Updates
- All services now copy proto files during build
- Expose gRPC ports in addition to HTTP ports

### 4. Communication Flow

#### Authentication Flow
1. Frontend sends login request to Gateway (HTTP)
2. Gateway calls Auth Service via gRPC
3. Auth Service processes and returns response via gRPC
4. Gateway forwards response to Frontend (HTTP)

#### Admin Operations Flow
1. Frontend sends admin request to Gateway (HTTP)
2. Gateway calls Admin Service via gRPC
3. Admin Service processes and returns response via gRPC
4. Gateway forwards response to Frontend (HTTP)

## Benefits of gRPC Implementation

### 1. Performance
- **Binary Protocol**: More efficient than JSON
- **HTTP/2**: Multiplexing, compression, and streaming
- **Type Safety**: Compile-time type checking

### 2. Developer Experience
- **Code Generation**: Automatic client/server code generation
- **Contract-First**: Protocol buffers serve as API contracts
- **Strong Typing**: Reduces runtime errors

### 3. Scalability
- **Bidirectional Streaming**: Support for real-time communication
- **Load Balancing**: Better support for microservice scaling
- **Interoperability**: Language-agnostic protocol

## Testing

### Manual Testing
```bash
# Start services
docker-compose up -d

# Test gRPC endpoints
node backend/test-grpc.js
```

### Service Health Checks
- **Auth Service**: `http://localhost:3001/api/health` (HTTP) + gRPC on port 50051
- **Admin Service**: `http://localhost:3002/api/health` (HTTP) + gRPC on port 50052
- **Gateway**: `http://localhost:3000/health` (HTTP)

## Migration Notes

### Backward Compatibility
- HTTP endpoints are still available for external clients
- Frontend continues to use HTTP/REST
- Only internal service-to-service communication uses gRPC

### Error Handling
- gRPC errors are properly mapped to HTTP status codes in Gateway
- Consistent error response format maintained

### Monitoring
- gRPC calls can be monitored using standard gRPC observability tools
- HTTP metrics still available for external traffic

## Future Enhancements

### 1. Streaming Support
- Real-time stock updates
- Live user activity feeds
- WebSocket replacement with gRPC streaming

### 2. Service Mesh Integration
- Istio or Linkerd for advanced traffic management
- Circuit breakers and retry policies
- Distributed tracing

### 3. Performance Optimization
- Connection pooling
- Load balancing strategies
- Caching layers

## Troubleshooting

### Common Issues
1. **Proto file not found**: Ensure proto files are copied in Docker builds
2. **Port conflicts**: Check that gRPC ports (50051, 50052) are available
3. **Type errors**: Verify protocol buffer definitions match service implementations

### Debug Commands
```bash
# Check gRPC server status
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50052 list

# Test specific methods
grpcurl -plaintext -d '{"email":"test@example.com"}' localhost:50051 auth.AuthService/Forgot
```

## Conclusion

The gRPC implementation provides a robust, performant foundation for microservice communication while maintaining backward compatibility with existing HTTP APIs. The architecture is now ready for scaling and can support advanced features like streaming and real-time updates. 