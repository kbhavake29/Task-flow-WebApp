#!/bin/bash
set +H  # Disable history expansion to allow ! in strings

# TaskFlow Backend API Test Script
# Comprehensive end-to-end testing of all API endpoints

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local auth_token=$6

    print_test "$description" >&2

    if [ -z "$data" ]; then
        if [ -z "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_token")
        fi
    else
        # Write data to temp file to avoid bash escaping issues
        local temp_file=$(mktemp)
        printf '%s' "$data" > "$temp_file"
        if [ -z "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -d @"$temp_file")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_token" \
                -d @"$temp_file")
        fi
        rm -f "$temp_file"
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        print_success "$description (Status: $http_code)" >&2
    else
        print_error "$description (Expected: $expected_status, Got: $http_code)" >&2
    fi

    # Return only the body for capture
    echo "$body"
}

# Start tests
print_header "TaskFlow Backend API Tests"

# Test 1: Health Check
print_header "1. Health Check"
response=$(test_endpoint "GET" "$BASE_URL/health" "" "200" "Health check endpoint")

# Test 2: Sign Up
print_header "2. Authentication - Sign Up"
SIGNUP_EMAIL="testuser_$(date +%s)@test.com"
SIGNUP_DATA="{\"email\":\"$SIGNUP_EMAIL\",\"password\":\"TestPass123!\"}"
signup_response=$(test_endpoint "POST" "$API_URL/auth/signup" "$SIGNUP_DATA" "201" "Create new user account")
ACCESS_TOKEN=$(echo "$signup_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    print_success "Received access token"
else
    print_error "No access token received"
fi

# Test 3: Sign In with existing account
print_header "3. Authentication - Sign In"
SIGNIN_DATA="{\"email\":\"test@taskflow.com\",\"password\":\"TestPass123!\"}"
signin_response=$(test_endpoint "POST" "$API_URL/auth/signin" "$SIGNIN_DATA" "200" "Sign in with existing account")
ACCESS_TOKEN=$(echo "$signin_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    print_success "Authenticated successfully"
else
    print_error "Authentication failed"
    echo "Exiting tests due to authentication failure"
    exit 1
fi

# Test 4: Get Current User
print_header "4. Get Current User"
test_endpoint "GET" "$API_URL/auth/user" "" "200" "Get authenticated user info" "$ACCESS_TOKEN"

# Test 5: Create Project
print_header "5. Projects - Create"
PROJECT_DATA="{\"name\":\"Test Project $(date +%s)\",\"description\":\"API Test Project\"}"
temp_file=$(mktemp)
printf '%s' "$PROJECT_DATA" > "$temp_file"
project_response=$(curl -s -X POST "$API_URL/projects" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d @"$temp_file")
rm -f "$temp_file"

PROJECT_ID=$(echo "$project_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('project', {}).get('id', ''))" 2>/dev/null)

if [ -n "$PROJECT_ID" ]; then
    print_success "Created project with ID: $PROJECT_ID"
    echo "$project_response" | python3 -m json.tool 2>/dev/null
else
    print_error "Failed to create project"
fi

# Test 6: Get All Projects
print_header "6. Projects - List All"
test_endpoint "GET" "$API_URL/projects" "" "200" "Get all projects" "$ACCESS_TOKEN"

# Test 7: Get Single Project
print_header "7. Projects - Get Single"
if [ -n "$PROJECT_ID" ]; then
    test_endpoint "GET" "$API_URL/projects/$PROJECT_ID" "" "200" "Get project by ID" "$ACCESS_TOKEN"
fi

# Test 8: Update Project
print_header "8. Projects - Update"
if [ -n "$PROJECT_ID" ]; then
    UPDATE_DATA="{\"name\":\"Updated Project Name\",\"description\":\"Updated description\"}"
    test_endpoint "PATCH" "$API_URL/projects/$PROJECT_ID" "$UPDATE_DATA" "200" "Update project" "$ACCESS_TOKEN"
fi

# Test 9: Create Task
print_header "9. Tasks - Create"
if [ -n "$PROJECT_ID" ]; then
    TASK_DATA="{\"projectId\":\"$PROJECT_ID\",\"title\":\"Test Task $(date +%s)\",\"dueDate\":\"2025-12-31T23:59:59.000Z\"}"
    temp_file=$(mktemp)
    printf '%s' "$TASK_DATA" > "$temp_file"
    task_response=$(curl -s -X POST "$API_URL/tasks" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d @"$temp_file")
    rm -f "$temp_file"

    TASK_ID=$(echo "$task_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('task', {}).get('id', ''))" 2>/dev/null)

    if [ -n "$TASK_ID" ]; then
        print_success "Created task with ID: $TASK_ID"
        echo "$task_response" | python3 -m json.tool 2>/dev/null
    else
        print_error "Failed to create task"
    fi
fi

# Test 10: Get All Tasks
print_header "10. Tasks - List All"
test_endpoint "GET" "$API_URL/tasks" "" "200" "Get all tasks" "$ACCESS_TOKEN"

# Test 11: Get Tasks by Project
print_header "11. Tasks - List by Project"
if [ -n "$PROJECT_ID" ]; then
    test_endpoint "GET" "$API_URL/tasks?projectId=$PROJECT_ID" "" "200" "Get tasks for specific project" "$ACCESS_TOKEN"
fi

# Test 12: Update Task
print_header "12. Tasks - Update"
if [ -n "$TASK_ID" ]; then
    TASK_UPDATE="{\"title\":\"Updated Task\",\"status\":\"completed\"}"
    test_endpoint "PATCH" "$API_URL/tasks/$TASK_ID" "$TASK_UPDATE" "200" "Update task status" "$ACCESS_TOKEN"
fi

# Test 13: Get Dashboard Stats
print_header "13. Stats - Dashboard"
test_endpoint "GET" "$API_URL/stats/dashboard" "" "200" "Get dashboard statistics" "$ACCESS_TOKEN"

# Test 14: Delete Task
print_header "14. Tasks - Delete"
if [ -n "$TASK_ID" ]; then
    test_endpoint "DELETE" "$API_URL/tasks/$TASK_ID" "" "200" "Delete task" "$ACCESS_TOKEN"
fi

# Test 15: Delete Project
print_header "15. Projects - Delete"
if [ -n "$PROJECT_ID" ]; then
    test_endpoint "DELETE" "$API_URL/projects/$PROJECT_ID" "" "200" "Delete project" "$ACCESS_TOKEN"
fi

# Test 16: Logout
print_header "16. Authentication - Logout"
test_endpoint "POST" "$API_URL/auth/logout" "" "200" "Logout user" "$ACCESS_TOKEN"

# Summary
print_header "Test Summary"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
