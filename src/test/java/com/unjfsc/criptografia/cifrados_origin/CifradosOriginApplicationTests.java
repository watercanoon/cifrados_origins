package com.unjfsc.criptografia.cifrados_origin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CifradosOriginApplicationTests {

    @Test
    void contextLoads() {
        String outer = "ABCDEFGILMNOPQRSTVXZ1234";
        String pt = "SIFVERAPRECISODECIRSIDILOCONVALOR"; // U replaced by V
        String[] cts = {
            "zclxcxhztmkpetgpfu&vlhsyskitiafaik",
            "zclxcxhztmkpetgpfu&vlhsyskitiafaii"
        };

        for (String ct : cts) {
            for (int direction = -23; direction < 24; direction++) {
                if (direction == 0) continue;
                for (int shiftAmount = -23; shiftAmount < 24; shiftAmount++) {
                    if (shiftAmount == 0) continue;

                    // Check consistency
                    boolean consistent = true;
                    char[] inner = new char[24];
                    
                    for (int i = 0; i < pt.length(); i++) {
                        char p = pt.charAt(i);
                        char c = ct.charAt(i);
                        int outerIdx = outer.indexOf(p);
                        if (outerIdx == -1) {
                            consistent = false;
                            break;
                        }

                        int block = i / 4;
                        int innerIdx = (block * shiftAmount + direction * (outerIdx - 9) + 24 * 1000) % 24;

                        if (inner[innerIdx] != 0 && inner[innerIdx] != c) {
                            consistent = false;
                            break;
                        }
                        inner[innerIdx] = c;
                    }

                    if (consistent) {
                        // Check uniqueness of characters in inner
                        boolean[] seen = new boolean[256];
                        int count = 0;
                        for (char c : inner) {
                            if (c != 0) {
                                if (seen[c]) {
                                    consistent = false;
                                    break;
                                }
                                seen[c] = true;
                                count++;
                            }
                        }
                        
                        if (consistent) {
                            System.out.println("=== SOLUTION FOUND ===");
                            System.out.println("Direction/Step: " + direction);
                            System.out.println("Shift Amount: " + shiftAmount);
                            System.out.println("Ciphertext used: " + ct);
                            System.out.print("Reconstructed Inner: ");
                            for (char c : inner) {
                                System.out.print(c == 0 ? '.' : c);
                            }
                            System.out.println();
                            System.out.println("Mapped characters: " + count + "/24");
                        }
                    }
                }
            }
        }
    }
}
